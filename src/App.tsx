/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { db, ensureFirebaseAuth } from './lib/firebase';
import { collection, doc, query, orderBy, onSnapshot, getDoc, getDocs, where, setDoc, serverTimestamp } from 'firebase/firestore';

// Pages
import HomePage from './components/pages/HomePage';
import LoanPage from './components/pages/LoanPage';
import WealthPage from './components/pages/WealthPage';
import RewardPage from './components/pages/RewardPage';
import MePage from './components/pages/MePage';
import TransactionHistoryView, { TransactionItem } from './components/TransactionHistoryView';

// Navigation & Global UI
import BottomNav, { NavTab } from './components/BottomNav';
import NotificationOverlay from './components/NotificationOverlay';
import TransactionReceipt from './components/TransactionReceipt';
import LoginScreen from './components/LoginScreen';
import RegistrationScreen from './components/RegistrationScreen';
import SplashScreen from './components/SplashScreen';
import FlashAlertOverlay from './components/FlashAlertOverlay';
import { generatePalmPayAccountNumber, normalizePalmPayAccountNumber, normalizePhoneNumber } from './utils/account';
import { formatNaira } from './utils/format';
import {
  FlashAlertData,
  playFlashChime,
  triggerHaptic,
  sendOutsideAppNotification,
  requestNotificationPermission,
} from './utils/alerts';

// Modals
import TransferModal from './components/TransferModal';
import ToPalmPayModal from './components/modals/ToPalmPayModal';
import AddFundsModal from './components/AddFundsModal';
import AirtimeModal from './components/AirtimeModal';
import DataModal from './components/DataModal';
import BettingModal from './components/modals/BettingModal';
import ElectricityModal from './components/modals/ElectricityModal';
import ReferModal from './components/modals/ReferModal';
import CardsModal from './components/modals/CardsModal';
import InsuranceModal from './components/modals/InsuranceModal';
import MoreServicesModal from './components/modals/MoreServicesModal';
import CustomerSupportModal from './components/modals/CustomerSupportModal';
import SecurityCenterModal from './components/modals/SecurityCenterModal';
import ClaimRewardModal from './components/modals/ClaimRewardModal';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [themeMode, setThemeMode] = useState<'system' | 'dark' | 'light'>(() => {
    const saved = localStorage.getItem('palmpay_theme_mode');
    return (saved as 'system' | 'dark' | 'light') || 'system';
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('palmpay_theme_mode');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });
  const [balance, setBalance] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showHistoryView, setShowHistoryView] = useState(false);

  // User Profile - isolated user profile state
  const [userProfile, setUserProfile] = useState({
    fullName: '',
    userName: '',
    phoneNumber: '',
    accountNumber: '',
    pin: '',
    imageUrl: '',
    balance: 0,
  });

  // Isolated Transactions subcollection state - strictly empty until authenticated user loads
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  // Modals state
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showToPalmPayModal, setShowToPalmPayModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showAirtimeModal, setShowAirtimeModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showBettingModal, setShowBettingModal] = useState(false);
  const [showElectricityModal, setShowElectricityModal] = useState(false);
  const [showReferModal, setShowReferModal] = useState(false);
  const [showCardsModal, setShowCardsModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showMoreServicesModal, setShowMoreServicesModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [claimModalData, setClaimModalData] = useState<{ title: string; bonus: number } | null>(null);
  const [activeFlashAlert, setActiveFlashAlert] = useState<FlashAlertData | null>(null);

  const isInitialLoadRef = useRef(true);

  // Request Notification Permissions on Mount
  useEffect(() => {
    requestNotificationPermission().catch(console.warn);
  }, []);

  // Firebase Auth & Firestore real-time sync - strictly isolated to current authenticated user
  useEffect(() => {
    // Ensure Firebase Auth session
    ensureFirebaseAuth().catch(console.warn);

    if (isLoggedIn && userProfile.phoneNumber) {
      try {
        const userRef = doc(db, 'users', userProfile.phoneNumber);

        // 1. Sync User Profile in Real Time
        const unsubUser = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (typeof data.balance === 'number') {
                setBalance(data.balance);
              }
              const safeAcc = normalizePalmPayAccountNumber(data.accountNumber || data.phoneNumber || userProfile.phoneNumber);
              setUserProfile((prev) => ({
                ...prev,
                ...data,
                accountNumber: safeAcc,
                balance: data.balance ?? prev.balance,
              }));
            }
          },
          (err) => {
            console.warn('User profile sync listener error:', err);
          }
        );

        // 2. Sync Transactions Subcollection in Real Time - Strictly only this user's records
        const transactionsRef = collection(userRef, 'transactions');
        const q = query(transactionsRef, orderBy('timestamp', 'desc'));

        const unsubTx = onSnapshot(
          q,
          (snapshot) => {
            if (!snapshot.empty) {
              const liveData = snapshot.docs.map((d) => {
                const data = d.data();
                return {
                  ...data,
                  id: d.id,
                  title: data.title || (data.type === 'credit' ? `Received from ${data.senderName || 'PalmPay Cashback'}` : `Send - ${data.recipient || 'Recipient'}`),
                  recipient: data.recipient,
                  senderName: data.senderName,
                  senderBank: data.senderBank,
                  amount: data.amount,
                  formattedAmount: data.formattedAmount || `${data.type === 'credit' ? '+' : '-'}₦${Number(data.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
                  type: data.type || 'transfer',
                  date: data.date || 'Just now',
                  month: (data.month || 'Sep') as 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun' | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec',
                  category: data.category || 'transfer',
                  status: 'successful' as const,
                  narration: data.narration,
                  reference: data.reference,
                  sessionId: data.sessionId,
                  accountNumber: data.accountNumber,
                };
              });

              // Detect incoming new transaction after initial load to fire Flash Alert
              if (!isInitialLoadRef.current) {
                snapshot.docChanges().forEach((change) => {
                  if (change.type === 'added') {
                    const data = change.doc.data();
                    const isCredit = data.type === 'credit';
                    const alertData: FlashAlertData = {
                      id: change.doc.id,
                      type: isCredit ? 'credit' : 'debit',
                      title: data.title || (isCredit ? 'Credit Alert Received' : 'Debit Alert'),
                      amount: Number(data.amount) || 0,
                      formattedAmount: data.formattedAmount || `${isCredit ? '+' : '-'}₦${Number(data.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
                      senderOrRecipient: isCredit ? (data.senderName || 'PalmPay Cashback') : (data.recipient || 'Commercial Bank'),
                      bankName: data.senderBank || 'PalmPay',
                      accountNumber: data.accountNumber || userProfile.accountNumber,
                      reference: data.reference,
                      date: data.date || 'Just now',
                      fullTransaction: {
                        ...data,
                        id: change.doc.id,
                      },
                    };

                    if (document.visibilityState === 'hidden') {
                      localStorage.setItem('palmpay_pending_inapp_alert', JSON.stringify(alertData));
                    } else {
                      setActiveFlashAlert(alertData);
                    }

                    playFlashChime(isCredit ? 'credit' : 'debit');
                    triggerHaptic();

                    sendOutsideAppNotification(alertData, () => {
                      setSelectedTransaction({
                        ...data,
                        id: change.doc.id,
                      });
                    });
                  }
                });
              }

              isInitialLoadRef.current = false;
              // Never merge foreign transactions; strictly set this user's live data
              setTransactions(liveData);
            } else {
              setTransactions([]);
            }
          },
          (err) => {
            console.warn('Transactions snapshot error:', err);
          }
        );

        return () => {
          unsubUser();
          unsubTx();
        };
      } catch (e) {
        console.warn('Firebase init warning:', e);
      }
    } else {
      setTransactions([]);
    }
  }, [isLoggedIn, userProfile.phoneNumber]);

  // Listen for the user entering the app (visibilityState changes to visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const pending = localStorage.getItem('palmpay_pending_inapp_alert');
        if (pending) {
          try {
            const alertData = JSON.parse(pending);
            // Delay slightly to allow full UI mounting/transition
            setTimeout(() => {
              setActiveFlashAlert(alertData);
              playFlashChime(alertData.type === 'credit' ? 'credit' : 'debit');
              triggerHaptic();
            }, 500);
          } catch (e) {
            console.warn('Error parsing pending alert:', e);
          }
          localStorage.removeItem('palmpay_pending_inapp_alert');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Also run on mount to handle clean start cases
    handleVisibilityChange();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Synchronize dynamic system dark/light theme setting overrides
  useEffect(() => {
    localStorage.setItem('palmpay_theme_mode', themeMode);
    if (themeMode !== 'system') {
      setDarkMode(themeMode === 'dark');
      return;
    }

    // Follow system settings
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setDarkMode(mediaQuery.matches);

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      setDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [themeMode]);

  const toggleDarkMode = () => {
    // Cycle theme modes: system -> dark -> light -> system
    setThemeMode((prev) => {
      const next = prev === 'system' ? 'dark' : prev === 'dark' ? 'light' : 'system';
      return next;
    });
  };

  const triggerManualFlashAlert = (tx: any) => {
    const isCredit = tx.type === 'credit';
    const alertData: FlashAlertData = {
      id: tx.id || `alert-${Date.now()}`,
      type: isCredit ? 'credit' : 'debit',
      title: tx.title || (isCredit ? 'Credit Alert Received' : 'Debit Alert'),
      amount: Number(tx.amount) || 0,
      formattedAmount: tx.formattedAmount || `${isCredit ? '+' : '-'}₦${Number(tx.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      senderOrRecipient: isCredit ? (tx.senderName || 'Sender') : (tx.recipient || 'Recipient'),
      bankName: tx.senderBank || 'PalmPay',
      accountNumber: tx.accountNumber || userProfile.accountNumber,
      reference: tx.reference,
      date: tx.date || 'Just now',
      fullTransaction: tx,
    };

    setActiveFlashAlert(alertData);
    playFlashChime(isCredit ? 'credit' : 'debit');
    triggerHaptic();
    sendOutsideAppNotification(alertData, () => setSelectedTransaction(tx));
  };

  const handleAddTransaction = (newTx: any) => {
    const formattedItem: TransactionItem = {
      id: newTx.id || `tx-${Date.now()}`,
      title: newTx.title || (newTx.type === 'credit' ? `Received from ${newTx.senderName || 'PEACE DANLAMI'}` : `Send - ${newTx.recipient || 'Recipient'}`),
      recipient: newTx.recipient,
      senderName: newTx.senderName,
      senderBank: newTx.senderBank,
      amount: newTx.amount,
      formattedAmount: newTx.formattedAmount || `${newTx.type === 'credit' ? '+' : '-'}₦${Number(newTx.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      type: newTx.type || 'transfer',
      date: newTx.date || 'Sep 29, 2026 ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      month: 'Sep',
      category: newTx.category || 'transfer',
      status: 'successful',
      narration: newTx.narration,
      reference: newTx.reference,
      sessionId: newTx.sessionId,
      accountNumber: newTx.accountNumber,
    };

    setTransactions((prev) => [formattedItem, ...prev]);
    triggerManualFlashAlert(formattedItem);
  };

  const handleClaimPromo = () => {
    setClaimModalData({
      title: 'Fund ₦450 Get ₦50 Extra Bonus',
      bonus: 50,
    });
  };

  const handleDailyGift = () => {
    setClaimModalData({
      title: 'Surprise Daily Gift Box',
      bonus: 30,
    });
  };

  const handleConfirmBonus = () => {
    if (claimModalData) {
      const bonus = claimModalData.bonus;
      setBalance((prev) => prev + bonus);
      handleAddTransaction({
        id: `bonus-${Date.now()}`,
        title: claimModalData.title,
        amount: bonus,
        formattedAmount: `+${formatNaira(bonus)}`,
        type: 'credit',
        senderName: 'PALMPAY BONUS',
        category: 'other',
      });
      setClaimModalData(null);
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!isLoggedIn) {
    if (authMode === 'login') {
      return (
        <LoginScreen
          onLogin={async (phone, password) => {
            await ensureFirebaseAuth();
            const cleanPhone = phone.trim().replace(/\D/g, '');
            const canonicalPhone = normalizePhoneNumber(cleanPhone);
            const acc10 = generatePalmPayAccountNumber(cleanPhone);

            try {
              let snap = await getDoc(doc(db, 'users', canonicalPhone));
              if (!snap.exists() && cleanPhone !== canonicalPhone) {
                snap = await getDoc(doc(db, 'users', cleanPhone));
              }
              if (!snap.exists() && acc10) {
                snap = await getDoc(doc(db, 'users', acc10));
              }
              if (!snap.exists()) {
                const qPhone = query(collection(db, 'users'), where('phoneNumber', '==', canonicalPhone));
                const qSnap = await getDocs(qPhone);
                if (!qSnap.empty) {
                  snap = qSnap.docs[0];
                }
              }
              if (!snap.exists() && acc10) {
                const qAcc = query(collection(db, 'users'), where('accountNumber', '==', acc10));
                const qSnap = await getDocs(qAcc);
                if (!qSnap.empty) {
                  snap = qSnap.docs[0];
                }
              }

              if (snap && snap.exists()) {
                const data = snap.data();
                const registeredPassword = data.password;
                if (registeredPassword && registeredPassword !== password) {
                  alert('Incorrect 6-digit password. Please try again.');
                  return;
                }

                const userDocId = snap.id;
                const safePhone = data.phoneNumber || userDocId;
                const safeAcc = normalizePalmPayAccountNumber(data.accountNumber || safePhone);

                // Isolate session: clear prior state completely
                isInitialLoadRef.current = true;
                setTransactions([]);
                setUserProfile({
                  fullName: data.fullName || '',
                  userName: data.userName || data.fullName?.split(' ')[0] || 'User',
                  phoneNumber: userDocId,
                  accountNumber: safeAcc,
                  pin: data.pin || '',
                  imageUrl: data.imageUrl || '',
                  balance: data.balance ?? 0,
                });
                setBalance(data.balance ?? 0);
              } else {
                alert('This account is not registered. Please tap the back arrow to Open an Account (Sign Up).');
                return;
              }
            } catch (err) {
              console.warn('Firebase login error:', err);
              alert('Unable to connect to database. Please check your connection.');
              return;
            }
            // Save last login phone & timestamp to allow password-only login within fast-path duration
            localStorage.setItem('palmpay_last_login_phone', phone);
            localStorage.setItem('palmpay_last_login_time', Date.now().toString());
            setIsLoggedIn(true);
          }}
          onSwitchToRegister={() => setAuthMode('register')}
        />
      );
    } else {
      return (
        <RegistrationScreen
          onRegister={async (data) => {
            await ensureFirebaseAuth();
            const cleanPhone = data.phoneNumber.trim().replace(/\D/g, '');
            const canonicalPhone = normalizePhoneNumber(cleanPhone);
            const acc10 = generatePalmPayAccountNumber(cleanPhone);

            try {
              // 1. Check for account existence to avoid accidental collision or overwrite
              const existingCheck = await getDoc(doc(db, 'users', canonicalPhone));
              if (existingCheck.exists()) {
                alert('An account with this mobile number already exists. Please Log In.');
                setAuthMode('login');
                return;
              }

              const newProfile = {
                fullName: data.fullName.trim(),
                userName: data.userName.trim(),
                phoneNumber: canonicalPhone,
                accountNumber: acc10,
                password: data.password,
                pin: data.pin,
                balance: 0,
                createdAt: serverTimestamp(),
              };

              // Store separately and securely under canonical phone identifier
              const userRef = doc(db, 'users', canonicalPhone);
              await setDoc(userRef, newProfile);

              // Initialize clean isolated session
              isInitialLoadRef.current = true;
              setTransactions([]);
              setUserProfile({
                fullName: newProfile.fullName,
                userName: newProfile.userName,
                phoneNumber: canonicalPhone,
                accountNumber: acc10,
                pin: newProfile.pin,
                imageUrl: '',
                balance: 0,
              });
              setBalance(0);

              // Save last login phone & timestamp
              localStorage.setItem('palmpay_last_login_phone', canonicalPhone);
              localStorage.setItem('palmpay_last_login_time', Date.now().toString());
              setIsLoggedIn(true);
            } catch (err) {
              console.warn('Firebase register error:', err);
              alert('Registration encountered an error. Please try again.');
            }
          }}
          onSwitchToLogin={() => setAuthMode('login')}
        />
      );
    }
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-[#0d0f17] text-slate-100 relative overflow-x-hidden selection:bg-[#7846f7] selection:text-white">
        {/* Ambient Refraction Glows */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-700/20 via-indigo-900/10 to-transparent pointer-events-none z-0" />
        <div className="fixed bottom-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none z-0" />

        {/* View Selection: If Transaction History is active, render the exact Screenshot view */}
        {showHistoryView ? (
          <TransactionHistoryView
            onBack={() => setShowHistoryView(false)}
            transactions={transactions}
            onSelectTransaction={(tx) => setSelectedTransaction(tx)}
          />
        ) : (
          <div className="relative z-10">
            {activeTab === 'home' && (
              <HomePage
                balance={balance}
                userProfile={userProfile}
                transactions={transactions}
                onSelectTransaction={(tx) => setSelectedTransaction(tx)}
                onSupportClick={() => setShowSupportModal(true)}
                onSecurityClick={() => setShowSecurityModal(true)}
                onBellClick={() => setShowNotifications(true)}
                onAddMoney={() => setShowAddFundsModal(true)}
                onViewHistory={() => setShowHistoryView(true)}
                onEarningsClick={() => setActiveTab('wealth')}
                onToBank={() => setShowTransferModal(true)}
                onToPalmPay={() => setShowToPalmPayModal(true)}
                onSavings={() => setActiveTab('wealth')}
                onLoan={() => setActiveTab('loan')}
                onClaimPromo={handleClaimPromo}
                onAirtime={() => setShowAirtimeModal(true)}
                onData={() => setShowDataModal(true)}
                onBetting={() => setShowBettingModal(true)}
                onElectricity={() => setShowElectricityModal(true)}
                onRefer={() => setShowReferModal(true)}
                onInsurance={() => setShowInsuranceModal(true)}
                onCards={() => setShowCardsModal(true)}
                onMore={() => setShowMoreServicesModal(true)}
                onGoCashback={() => setShowAirtimeModal(true)}
                onSaveNow={() => setActiveTab('wealth')}
                onGrabChallenge={() => setActiveTab('wealth')}
                onMoreWealth={() => setActiveTab('wealth')}
                onGoDataRecharge={() => setShowDataModal(true)}
                onDailyGift={handleDailyGift}
              />
            )}

            {activeTab === 'loan' && (
              <LoanPage
                balance={balance}
                onApplySuccess={(amount) => {
                  setBalance((prev) => prev + amount);
                  handleAddTransaction({
                    title: 'Flexi-Cash Loan Disbursement',
                    amount,
                    formattedAmount: `+${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
                    type: 'credit',
                    category: 'transfer',
                  });
                  alert(`₦${amount.toLocaleString()} has been disbursed to your Available Balance!`);
                  setActiveTab('home');
                }}
              />
            )}

            {activeTab === 'wealth' && (
              <WealthPage
                balance={balance}
                onDepositSuccess={(amt) => {
                  setBalance((prev) => prev - amt);
                  handleAddTransaction({
                    title: 'Deposit to Prime Wealth Savings',
                    amount: amt,
                    formattedAmount: `-${amt.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
                    type: 'transfer',
                    category: 'cashbox',
                  });
                }}
              />
            )}

            {activeTab === 'reward' && (
              <RewardPage
                onClaimVoucher={(title, val) => {
                  if (val > 0) {
                    setBalance((prev) => prev + val);
                    handleAddTransaction({
                      title: `Reward Claim: ${title}`,
                      amount: val,
                      formattedAmount: `+${val.toFixed(2)}`,
                      type: 'credit',
                      category: 'other',
                    });
                  }
                }}
              />
            )}

            {activeTab === 'me' && (
              <MePage
                userProfile={userProfile}
                balance={balance}
                darkMode={darkMode}
                themeMode={themeMode}
                toggleDarkMode={toggleDarkMode}
                onViewHistory={() => setShowHistoryView(true)}
                onSecurityCenter={() => setShowSecurityModal(true)}
                onSupport={() => setShowSupportModal(true)}
                onLogout={() => {
                  setIsLoggedIn(false);
                  setActiveTab('home');
                  setUserProfile({
                    fullName: '',
                    userName: '',
                    phoneNumber: '',
                    accountNumber: '',
                    pin: '',
                    imageUrl: '',
                    balance: 0,
                  });
                  setTransactions([]);
                  setBalance(0);
                  setActiveFlashAlert(null);
                  isInitialLoadRef.current = true;
                  localStorage.removeItem('palmpay_last_login_phone');
                  localStorage.removeItem('palmpay_last_login_time');
                  localStorage.removeItem('palmpay_pending_inapp_alert');
                }}
              />
            )}
          </div>
        )}

        {/* Flash Alert Banner for In-App and Live Incoming Credits & Debits */}
        <FlashAlertOverlay
          alert={activeFlashAlert}
          onDismiss={() => setActiveFlashAlert(null)}
          onViewReceipt={(tx) => setSelectedTransaction(tx)}
        />

        {/* Floating Bottom Navigation Bar (hides on scroll, reappears when stopped) */}
        {!showHistoryView && (
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        )}

        {/* Modals & Overlays */}
        {showNotifications && (
          <NotificationOverlay
            onClose={() => setShowNotifications(false)}
            transactions={transactions}
            onSelectTransaction={(tx) => setSelectedTransaction(tx)}
          />
        )}

        {selectedTransaction && (
          <TransactionReceipt
            transaction={selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
            onSupportClick={() => setShowSupportModal(true)}
            onWealthClick={() => setActiveTab('wealth')}
          />
        )}

        {showTransferModal && (
          <TransferModal
            balance={balance}
            setBalance={setBalance}
            userProfile={userProfile}
            onClose={() => setShowTransferModal(false)}
            onSuccessTransaction={(tx) => {
              handleAddTransaction({
                ...tx,
                title: `Send - ${tx.recipient || 'Commercial Bank'}`,
                formattedAmount: `-${formatNaira(tx.amount)}`,
                category: 'transfer',
              });
            }}
          />
        )}

        {showToPalmPayModal && (
          <ToPalmPayModal
            balance={balance}
            setBalance={setBalance}
            userProfile={userProfile}
            onClose={() => setShowToPalmPayModal(false)}
            onSuccessTransaction={(tx) => {
              handleAddTransaction({
                ...tx,
                title: `Send - ${tx.recipient || 'PalmPay User'}`,
                formattedAmount: `-${formatNaira(tx.amount)}`,
                category: 'transfer',
              });
            }}
          />
        )}

        {showAddFundsModal && (
          <AddFundsModal
            balance={balance}
            setBalance={setBalance}
            userProfile={userProfile}
            onClose={() => setShowAddFundsModal(false)}
            onSuccessTransaction={handleAddTransaction}
            onViewHistory={() => {
              setShowAddFundsModal(false);
              setShowHistoryView(true);
            }}
          />
        )}

        {showAirtimeModal && (
          <AirtimeModal
            balance={balance}
            setBalance={setBalance}
            userProfile={userProfile}
            onClose={() => setShowAirtimeModal(false)}
            onSuccessTransaction={(tx) => {
              handleAddTransaction({
                ...tx,
                title: 'Top up Airtime',
                formattedAmount: `-${formatNaira(tx.amount)}`,
                category: 'airtime',
              });
            }}
          />
        )}

        {showDataModal && (
          <DataModal
            balance={balance}
            setBalance={setBalance}
            userProfile={userProfile}
            onClose={() => setShowDataModal(false)}
            onSuccessTransaction={(tx) => {
              handleAddTransaction({
                ...tx,
                title: tx.recipient || 'Data Recharge',
                formattedAmount: `-${formatNaira(tx.amount)}`,
                category: 'airtime',
              });
            }}
          />
        )}

        {showBettingModal && (
          <BettingModal
            balance={balance}
            setBalance={setBalance}
            userProfile={userProfile}
            onClose={() => setShowBettingModal(false)}
            onSuccessTransaction={(tx) => {
              handleAddTransaction({
                ...tx,
                title: tx.recipient || 'Betting Wallet Fund',
                formattedAmount: `-${formatNaira(tx.amount)}`,
                category: 'other',
              });
            }}
          />
        )}

        {showElectricityModal && (
          <ElectricityModal
            balance={balance}
            setBalance={setBalance}
            userProfile={userProfile}
            onClose={() => setShowElectricityModal(false)}
            onSuccessTransaction={(tx) => {
              handleAddTransaction({
                ...tx,
                title: 'Electricity',
                formattedAmount: `-${Number(tx.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
                category: 'electricity',
              });
            }}
          />
        )}

        {showReferModal && (
          <ReferModal onClose={() => setShowReferModal(false)} />
        )}

        {showCardsModal && (
          <CardsModal
            onClose={() => setShowCardsModal(false)}
            userProfile={userProfile}
          />
        )}

        {showInsuranceModal && (
          <InsuranceModal onClose={() => setShowInsuranceModal(false)} />
        )}

        {showMoreServicesModal && (
          <MoreServicesModal
            onClose={() => setShowMoreServicesModal(false)}
            onSelectService={(s) => {
              setShowMoreServicesModal(false);
              alert(`${s} service opened.`);
            }}
          />
        )}

        {showSupportModal && (
          <CustomerSupportModal onClose={() => setShowSupportModal(false)} />
        )}

        {showSecurityModal && (
          <SecurityCenterModal
            onClose={() => setShowSecurityModal(false)}
            userProfile={userProfile}
          />
        )}

        {claimModalData && (
          <ClaimRewardModal
            title={claimModalData.title}
            bonusAmount={claimModalData.bonus}
            onClose={() => setClaimModalData(null)}
            onConfirmClaim={handleConfirmBonus}
          />
        )}
      </div>
    </div>
  );
}
