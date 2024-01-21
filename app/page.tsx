"use client"; // This is a client component
import * as fcl from "@onflow/fcl";
import Head from 'next/head';
import "../flow/config";
import { useState, useEffect, SetStateAction } from "react";
import ExpenseSplitter from './screen';
import { ref, onValue, set, push, query, equalTo, get } from 'firebase/database';
import { db } from '../utils/firebase';

let globalcount: number = 1;

interface User {
  loggedIn: boolean | null;
  addr?: string;
}

interface HeaderProps {
  title: string;
  createdBy: string;
}



const Header: React.FC<HeaderProps> = ({ title, createdBy }) => (
  <header className="flex justify-between items-center p-6 bg-green-50 
  font-mono border rounded mr-2 ml-2 shadow-lg border-slate-700">
    <div className='text-xl'>❇️ {title} ❇️</div>
    <div>by <a href="https://twitter.com/shyynux"
    className="text-green-500"> {createdBy}</a></div>
  </header>
);

export default function Home() {
  const [user, setUser] = useState<User>({ loggedIn: null });
  const [name, setName] = useState('No Profile');
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [notifications, setNotifications] = useState<string[]>(['Notification 1', 'Notification 2']);
  const [showNotifications, setShowNotifications] = useState(true);

  let coolusername: string = "dolce";

  const findUserByUsername = async (db: any, username: any) => {
    try {
      // Query the users node for the specified username
      const usersRef = ref(db, 'users');
      const userQuery = query(usersRef, equalTo('username', username));
      const userSnapshot = await get(userQuery);
  
      // Check if the user exists in the users node
      if (userSnapshot.exists()) {
        const userData = userSnapshot.val();
        console.log('User found:', userData);
      } else {
        console.log('User not found');
      }
  
      // Query the notifications node for the specified username and status
      const notificationsRef = ref(db, 'notifications');
      const notificationsQuery = query(
        notificationsRef,
        equalTo('username', username),
        equalTo('status', 'yes')
      );
  
      const notificationsSnapshot = await get(notificationsQuery);
  
      // Check if there are notifications for the specified user with status 'yes'
      if (notificationsSnapshot.exists()) {
        const notificationsData = notificationsSnapshot.val();
        console.log('Notifications found:', notificationsData);
      } else {
        console.log('No pending notifications');
      }
    } catch (error: any) {
      console.error('Error finding user:', error.message);
    }
  };

  const markAsDone = () => {
    // Add logic to update the status field in the backend
    // For now, let's just hide the notifications
    var usernamex = 'shaila';
    findUserByUsername(db, usernamex);
    setShowNotifications(false);
  };
  
  useEffect(() => fcl.currentUser.subscribe(setUser), []);

  // useEffect(() => fcl.currentUser.subscribe((userData: User) => {
  //   setUser(userData)
  //   console.log("hi + ",userData)
  // }), [])

  /* it is reading the names */
  const sendQuery = async (): Promise<void> => {
    const profile = await fcl.query({
      cadence: `
        import Profile from 0xProfile
  
        pub fun main(address: Address): Profile.ReadOnly? {
          return Profile.read(address)
        }
      `,
      args: (arg: any, t: any) => [arg(user.addr, t.Address)],
    });
  
    setName(profile?.name ?? 'No Profile');
  };

  const initAccount = async () => {
    const transactionId = await fcl.mutate({
      cadence: `
        import Profile from 0xProfile
  
        transaction {
          prepare(account: AuthAccount) {
            // Only initialize the account if it hasn't already been initialized
            if (!Profile.check(account.address)) {
              // This creates and stores the profile in the user's account
              account.save(<- Profile.new(), to: Profile.privatePath)
  
              // This creates the public capability that lets applications read the profile's info
              account.link<&Profile.Base{Profile.Public}>(Profile.publicPath, target: Profile.privatePath)
            }
          }
        }
      `,
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 50
    })
  
    const transaction = await fcl.tx(transactionId).onceSealed();
    console.log(transaction);

  }

  const executeTransaction = async (): Promise<void> => {
    const transactionId = await fcl.mutate({
      cadence: `
        import Profile from 0xProfile
  
        transaction(name: String) {
          prepare(account: AuthAccount) {
            account
              .borrow<&Profile.Base{Profile.Owner}>(from: Profile.privatePath)!
              .setName(name)
          }
        }
      `,
      args: (arg: any, t: any) => [arg(`${coolusername}`, t.String)],
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 50
    });
  
    fcl.tx(transactionId).subscribe((res: { status: SetStateAction<null>; }) => setTransactionStatus(res.status));
  };

  const userAddrMock = "Mock Address";
  const userNameMock = "Mock User";
  const transactionStatusMock = "Mock Status";
  
  const AuthedState: React.FC = () => {
    return (
      <div className='flex'>
        <div className='flex flex-col justify-center items-center w-1/2 pt-4 p-8 border rounded'>
          <div>My Address: {user?.addr ?? "No Address"}</div>
          <div>My Profile Name: {name ?? "--"}</div>
          <div>Transaction Status: {transactionStatus ?? "--"}</div>
          <button className='m-2 p-4 bg-green-200' onClick={sendQuery}>
            query my name
          </button>
          <button className='m-2 p-4 bg-green-200' onClick={initAccount}>
            Init Account
          </button>
          <button className='m-2 p-4 bg-green-200' onClick={executeTransaction}>
            set my name
          </button>
          <button className="bg-green-200" onClick={fcl.unauthenticate}>
            Log Out
          </button>
          <div className='border p-4 mt-4'>
          <h2 className='text-lg font-bold mb-2'>Notifications</h2>
          {showNotifications ? (
            <ul>
              {notifications.map((notification, index) => (
                <li key={index}>{notification}</li>
              ))}
            </ul>
          ) : (
            <p>No pending notifications</p>
          )}
          <button onClick={markAsDone} className='mt-2 p-2 bg-green-300 text-black rounded'>
            Mark as Done
          </button>
        </div>

        </div>
        
        <div className='flex w-1/2 p-8 justify-center items-center border rounded'>
          <ExpenseSplitter />
        </div>
      </div>
    );
  };
  

  const UnauthenticatedState: React.FC = () => {
    return (
      <div className="flex flex-row items-center justify-center h-screen">
        <button onClick={fcl.logIn}>
          Log In
        </button>
        <button onClick={fcl.signUp}>
          Sign Up
        </button>
      </div>
    );
  };
  

  return (
    <div>
      <Head>
        <title>logged in - nextJS</title>
        <meta name="description" content="Roommates - A web3 app on Flow!" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <Header title="Roommates" createdBy="@shyynux" />
      {user.loggedIn ? <AuthedState /> : <UnauthenticatedState />}
    </div>
  );
}
