import React, { useState } from 'react';
import { apiUrl } from "../config/config";
import { useNavigate } from "react-router-dom";
import "../css/orderfood.css";

const OrderFood = () => {
  const [pnr, setPnr] = useState('');
  const [booking, setBooking] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const validatePNR = async (pnrNumber) => {
    try {
      const res = await fetch(`${apiUrl}/validate-pnr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ pnrNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "PNR not valid");
      }

      return data; // booking details
    } catch (err) {
      throw new Error(err.message || "PNR not valid");
    }
  };

  const handleSubmitPNR = async () => {
    try {
      setError('');
      setConfirmation('');
      const data = await validatePNR(pnr);
      setBooking(data);

      const res = await fetch(`${apiUrl}/food-items`, {
        method: "GET", 
        headers: {
          "Content-Type": "application/json", 
        },
        credentials: "include", 
      });

      const data1 = await res.json(); 
      setFoodItems(data1); 
    } catch (err) {
      setBooking(null);
      setFoodItems([]);
      setError(err.message);
    }
  };

  const addToCart = (item) => {
    const existingItem = cart.find(c => c.id === item.id);
    if (existingItem) {
      setCart(cart.map(c => 
        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (item) => {
    const existingItem = cart.find(c => c.id === item.id);
    if(existingItem){
        if (existingItem.quantity > 1) {
        setCart(cart.map(c => 
            c.id === item.id ? { ...c, quantity: c.quantity - 1 } : c
        ));
        } else {
        setCart(cart.filter(c => c.id !== item.id));
        }
    }
  };

  const placeOrder = async () => {
    try {
      const res = await fetch(`${apiUrl}/order-food`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ booking_id: booking.booking_id, items: cart }),
      });
      const result = await res.json();
      setConfirmation(result.message || 'Order placed successfully!');
      setCart([]);
    } catch (err) {
      setError('Failed to place the order');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Order Food on Train</h1>

      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Enter PNR number"
          value={pnr}
          onChange={e => setPnr(e.target.value)}
          className="border p-2 flex-1"
        />
        <button onClick={handleSubmitPNR} className="ml-2 bg-blue-500 text-white p-2 rounded">
          Submit
        </button>
      </div>

      {error && <p className="text-red-500 mt-2">{error}</p>}

      {booking && (
        <div className="mt-4">
          <h2 className="font-semibold">Available Food Items</h2>
          <ul>
            {foodItems.map(item => (
              <li key={item.id} className="flex justify-between items-center mt-2">
                {item.name} - ₹{item.price}
                <div className="flex items-center">
                  <button 
                    onClick={() => addToCart(item)} 
                    className="ml-4 bg-green-500 text-white p-1 rounded">
                    +
                  </button>
                  <button 
                    onClick={() => removeFromCart(item)} 
                    className="ml-2 bg-red-500 text-white p-1 rounded">
                    -
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {cart.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold">Your Cart</h3>
          <ul>
            {cart.map(c => (
              <li key={c.id} className="flex justify-between items-center mt-2">
                {c.name} x {c.quantity} - ₹{c.price * c.quantity}
              </li>
            ))}
          </ul>
          <button 
            onClick={placeOrder} 
            className="mt-2 bg-purple-600 text-white p-2 rounded">
            Place Order
          </button>
        </div>
      )}

      {confirmation && <p className="text-green-600 mt-4">{confirmation}</p>}
    </div>
  );
};

export default OrderFood;
