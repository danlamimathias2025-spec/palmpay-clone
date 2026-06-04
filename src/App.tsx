/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { db } from './lib/firebase';
import { collection, doc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { loginUser, registerUser } from './lib/auth';
import Header from './components/Header';
import NotificationOverlay from './components/NotificationOverlay';
import AccountCard from './components/AccountCard';
import ServicesGrid from './components/ServicesGrid';
import MarketingBanner from './components/MarketingBanner';
import RecentTransactions from './components/RecentTransactions';
import TransactionReceipt from './components/TransactionReceipt';
import TransferModal from './components/TransferModal';
import AddFundsModal from './components/AddFundsModal';
import AirtimeModal from './components/AirtimeModal';
import DataModal from './components/DataModal';
import CouponModal from './components/CouponModal';
import BottomNav from './components/BottomNav';
import RegistrationScreen from './components/RegistrationScreen';
import LoginScreen from './components/LoginScreen';
import AccountPage from './components/AccountPage';
import SplashScreen from './components/SplashScreen';

export default function App() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [balance, setBalance] = useState(0); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [showSplash, setShowSplash] = useState(true);
  const [activeView, setActiveView] = useState<'home' | 'account'>('home');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showAirtimeModal, setShowAirtimeModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState({
    fullName: '',
    userName: '',
    phoneNumber: '',
    password: '',
    pin: '',
    imageUrl: '',
    balance: 0,
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'vendor'>('date');

  const sortedTransactions = [...transactions].sort((a, b) => {
      if (sortBy === 'amount') return Number(b.amount) - Number(a.amount);
      if (sortBy === 'vendor') {
          const vendorA = a.recipient || '';
          const vendorB = b.recipient || '';
          return vendorA.localeCompare(vendorB);
      }
      const dateA = a.timestamp?.seconds || 0;
      const dateB = b.timestamp?.seconds || 0;
      return dateB - dateA;
  });

  useEffect(() => {
    if (userProfile.phoneNumber) {
        const userRef = doc(db, 'users', userProfile.phoneNumber);
        const transactionsRef = collection(userRef, 'transactions');
        const q = query(transactionsRef, orderBy('timestamp', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTransactions(data);
        });
        
        return () => unsubscribe();
    }
  }, [userProfile.phoneNumber]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  const toggleDarkMode = () => setDarkMode(!darkMode);

  useEffect(() => {
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && e.touches[0].clientY - startY > 50) {
        // Pulling down
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (window.scrollY === 0 && e.changedTouches[0].clientY - startY > 100) {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 2000);
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!isLoggedIn) {
    if (authMode === 'login') {
      return (
        <LoginScreen 
          onLogin={async (phone, password) => {
            try {
              const userData = await loginUser(phone, password);
              setUserProfile(userData);
              setBalance(userData.balance);
              setIsLoggedIn(true);
            } catch (error: any) {
              alert(error.message);
            }
          }} 
          onSwitchToRegister={() => setAuthMode('register')}
        />
      );
    } else {
      return (
        <RegistrationScreen 
          onRegister={async (data) => {
            try {
              const userData = await registerUser(data);
              setUserProfile(userData);
              setBalance(userData.balance);
              setIsLoggedIn(true);
            } catch (error: any) {
              alert(error.message);
            }
          }} 
          onSwitchToLogin={() => setAuthMode('login')}
        />
      );
    }
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-gray-950 pb-24 dark:text-gray-100">
        {isRefreshing && (
          <div className="flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <Loader2 className="animate-spin text-blue-600" />
          </div>
        )}
        
        {activeView === 'home' ? (
          <>
            <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} userProfile={userProfile} onBellClick={() => setShowNotifications(true)} />
            <AccountCard balance={balance} />
            <ServicesGrid 
                onTransfer={() => setShowTransferModal(true)} 
                onAddFunds={() => setShowAddFundsModal(true)} 
                onAirtime={() => setShowAirtimeModal(true)}
                onData={() => setShowDataModal(true)}
                onCoupon={() => setShowCouponModal(true)}
            />
            <MarketingBanner />
            <RecentTransactions transactions={sortedTransactions} onSelect={setSelectedTransaction} sortBy={sortBy} setSortBy={setSortBy} />
          </>
        ) : (
          <AccountPage userProfile={userProfile} setUserProfile={setUserProfile} onLogout={() => { setIsLoggedIn(false); setActiveView('home'); }} />
        )}
        
        <BottomNav activeView={activeView} setActiveView={setActiveView} />
        {showNotifications && <NotificationOverlay onClose={() => setShowNotifications(false)} notifications={[{title: 'Welcome', message: 'Welcome to your account!'}]} />}
        {selectedTransaction && <TransactionReceipt transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />}
        {showTransferModal && <TransferModal userProfile={userProfile} balance={balance} setBalance={setBalance} onClose={() => setShowTransferModal(false)} />}
        {showAddFundsModal && <AddFundsModal balance={balance} setBalance={setBalance} userProfile={userProfile} onClose={() => setShowAddFundsModal(false)} />}
        {showAirtimeModal && <AirtimeModal balance={balance} setBalance={setBalance} userProfile={userProfile} onClose={() => setShowAirtimeModal(false)} />}
        {showDataModal && <DataModal balance={balance} setBalance={setBalance} userProfile={userProfile} onClose={() => setShowDataModal(false)} />}
        {showCouponModal && <CouponModal balance={balance} setBalance={setBalance} userProfile={userProfile} onClose={() => setShowCouponModal(false)} />}
      </div>
    </div>
  );
}
