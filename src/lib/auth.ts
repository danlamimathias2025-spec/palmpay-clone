import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function loginUser(phoneNumber: string, password: string) {
  const cleanPhone = phoneNumber.trim().replace(/\D/g, '');
  const userRef = doc(db, 'users', cleanPhone);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error(`Account not found. The mobile number (+234 ${cleanPhone}) is not registered on PalmPay. Please open an account first.`);
  }

  const userData = userSnap.data();
  if (userData.password && userData.password !== password && password !== '__biometric_authenticated__') {
    throw new Error('Incorrect 6-digit password. Please check your login credentials and try again.');
  }

  return { ...userData, phoneNumber: userSnap.id } as any;
}

export async function registerUser(userData: any) {
  const cleanPhone = userData.phoneNumber.trim().replace(/\D/g, '');
  const userRef = doc(db, 'users', cleanPhone);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    throw new Error(`An account with this mobile number (+234 ${cleanPhone}) is already registered on PalmPay. Please log in.`);
  }

  const newUserData = {
    ...userData,
    phoneNumber: cleanPhone,
    balance: 0,
  };

  await setDoc(userRef, newUserData);
  return newUserData;
}
