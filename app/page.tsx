"use client"; // This is a client component
import Head from 'next/head';
import "../flow/config";
import { useState, useEffect } from "react";
import ExpenseSplitter from './screen';
import * as fcl from "@onflow/fcl";

interface User {
  loggedIn: boolean | null;
  addr?: string;
}

export default function Home() {
  const [user, setUser] = useState<User>({ loggedIn: null });
  const [name, setName] = useState('No Profile');
  const [transactionStatus, setTransactionStatus] = useState(null);
  
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
      args: (arg: any, t: any) => [arg("bizgirly", t.String)],
      payer: fcl.authz,
      proposer: fcl.authz,
      authorizations: [fcl.authz],
      limit: 50
    });
  
    fcl.tx(transactionId).subscribe(res => setTransactionStatus(res.status));
  };
  

  const AuthedState: React.FC = () => {
    return (
      <div>
        <div>Address: {user?.addr ?? "No Address"}</div>
        <div>Profile Name: {name ?? "--"}</div> 
        <div>Transaction Status: {transactionStatus ?? "--"}</div>
        <button onClick={sendQuery}>Send Query</button> 
        <button onClick={initAccount}>Init Account</button> 
        <button onClick={executeTransaction}>Execute Transaction</button>
        <button onClick={fcl.unauthenticate}>Log Out</button>
       <ExpenseSplitter />
      </div>
    );
  };

  const UnauthenticatedState: React.FC = () => {
    return (
      <div>
        <button onClick={fcl.logIn}>Log In</button>
        <button onClick={fcl.signUp}>Sign Up</button>
      </div>
    );
  };

  return (
    <div>
      <Head>
        <title>FCL Quickstart with NextJS</title>
        <meta name="description" content="Roommates - A web3 app on Flow!" />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <h1>Flow App</h1>
      {user.loggedIn ? <AuthedState /> : <UnauthenticatedState />}
    </div>
  );
}
