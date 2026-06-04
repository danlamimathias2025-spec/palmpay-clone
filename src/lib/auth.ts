import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function loginUser(phoneNumber: string, password: string) {
    const userRef = doc(db, 'users', phoneNumber);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
        throw new Error('This account is not registered. Please register first.');
    }
    
    const userData = userSnap.data();
    if (userData.password !== password) {
        throw new Error('Incorrect password.');
    }
    
    return { ...userData, phoneNumber } as any;
}

export async function registerUser(userData: any) {
    const userRef = doc(db, 'users', userData.phoneNumber);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
        throw new Error('This account is already registered. Please login.');
    }
    
    const newUserData = {
        ...userData,
        balance: 100000, // Initial balance
        pin: '1234', // Default PIN/Or set by user if added
    };
    
    await setDoc(userRef, newUserData);
    return newUserData;
}
