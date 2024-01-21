import "./globals.css";
import React, { useState } from 'react';

const ExpenseSplitter: React.FC = () => {
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>('');
  const [friends, setFriends] = useState<{ username: string; percentagePaid: number }[]>([]);
  const [splitResult, setSplitResult] = useState<string[]>([]);

  const addFriend = () => {
    if (friends.length < 10) {
      setFriends([...friends, { username: '', percentagePaid: 0 }]);
    }
  };

  const addUser = () => {
    console.log("total amount is - ", totalAmount);
    const usernameElement = document.getElementById('username') as HTMLInputElement;
    const percentageElement = document.getElementById('percentage') as HTMLInputElement;

    const user: string = usernameElement.value;
    const percentage: number = parseFloat(percentageElement.value);

    if (!isNaN(percentage)) {
      setFriends((prevFriends) => [...prevFriends, { username: user, percentagePaid: percentage }]);
    }

    // Clear input fields after adding a friend
    usernameElement.value = '';
    percentageElement.value = '';
  };

  const handleSplit = () => {
    const result = calculatePayments();
    const share = calculateShares();
    setSplitResult(share);
    // setSplitResult(result);
  };

  function calculateShares(): string[] {
    const totalPercentage = friends.reduce((sum, friend) => sum + friend.percentagePaid, 0);
    console.log("totalPercentage is", totalPercentage);
    const numberOfFriends = friends.length;

    // If total percentage is 0, return an empty result
    if (totalPercentage === 0) {
      return [];
    }

    const shares: Record<string, number> = {};
    const settlement: Record<string, string> = {};

    friends.forEach((friend) => {
      const paid = (friend.percentagePaid / totalPercentage) * totalAmount; 
      const share = totalAmount/numberOfFriends;
      const settleAmount = paid - share;
      shares[friend.username] = settleAmount;
    });

  const result: string[] = Object.entries(shares).map(([username, amount]) => {
    if (amount > 0) {
        settlement[username] = "has paid";
      return `${username} has to receive $${Math.abs(amount).toFixed(2)} for ${description}`;
    } else {
        settlement[username] = "will pay";
      return `${username} has to pay $${amount.toFixed(2)} for ${description}`;
    }
  });
    console.log(settlement);
    return result;
  }

  const calculatePayments = (): string[] => {
    const totalPercentage = friends.reduce((sum, friend) => sum + friend.percentagePaid, 0);
  
    if (totalPercentage === 0) {
      return [];
    }
  
    const payments: Record<string, number> = {};
  
    friends.forEach((payer) => {
      friends.forEach((payee) => {
        if (payer.username !== payee.username) {
          const amount = (payer.percentagePaid / totalPercentage) * payee.percentagePaid * totalAmount;
          payments[payee.username] = (payments[payee.username] || 0) + amount;
        }
      });
    });
  
    const result: string[] = Object.entries(payments).map(([username, amount]) => `${username} has to pay $${amount.toFixed(2)}`);
    return result;
  };
  

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-green-50 p-8 rounded shadow-xl w-96 border rounded 
      border-slate-500">
        <h1 className="text-xl font-mono mb-4">Split expenses with your roommates</h1>

        <div className="mb-4">
          <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-600">
            Total Amount in USD
          </label>
          <input
            type="number"
            id="totalAmount"
            onChange={(e) => setTotalAmount(Number(e.target.value))}
            className="mt-1 p-2 border rounded w-full"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-600">
            Description
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 p-2 border rounded w-full"
          />
        </div>

        <div className="flex mb-2">
          <input
            type="text"
            id="username"
            placeholder="Username"
            className="mr-2 p-2 border rounded w-1/3"
          />
          <input
            type="number"
            id="percentage"
            placeholder="% Paid"
            className="mr-2 p-2 border rounded w-1/3"
          />
          <button onClick={addUser} className="p-2 bg-green-300 text-black rounded">
            Add
          </button>
        </div>

        {friends.map((friend, index) => (
          <div key={index} className="flex mb-2">
            <input
              type="text"
              placeholder="Username"
              value={friend.username}
              readOnly
              className="mr-2 p-2 border rounded w-1/3"
            />
            <input
              type="number"
              placeholder="% Paid"
              value={friend.percentagePaid}
              readOnly
              className="mr-2 p-2 border rounded w-1/3"
            />
          </div>
        ))}

        <button onClick={handleSplit} className="p-2 bg-green-400 text-black rounded">
          Split
        </button>

        {splitResult.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-bold mb-2">Split Result:</h2>
            {splitResult.map((result, index) => (
              <p key={index}>{result}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseSplitter;
