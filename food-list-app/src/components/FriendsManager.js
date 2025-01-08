import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

const FriendsManager = ({ currentUser }) => {
  const [friends, setFriends] = useState([]);
  const [sharedListAccess, setSharedListAccess] = useState([]);
  const [newFriend, setNewFriend] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  // Încarcă datele inițiale despre prieteni
  useEffect(() => {
    fetchFriendsData();
  }, [currentUser]);

  const fetchFriendsData = async () => {
    try {
      const response = await fetch(`http://localhost:5000/friends/${currentUser}`);
      const data = await response.json();
      setFriends(data.friends || []);
      setSharedListAccess(data.sharedListAccess || []);
      setLoading(false);
    } catch (err) {
      setError('Eroare la încărcarea prietenilor');
      setLoading(false);
    }
  };

  const addFriend = async () => {
    if (!newFriend.trim()) {
      setError('Introduceți un nume de utilizator');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/friends/${currentUser}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendUsername: newFriend })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setFriends(data.friends);
      setNewFriend('');
      setSuccess('Prieten adăugat cu succes!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Eroare la adăugarea prietenului');
      setTimeout(() => setError(''), 3000);
    }
  };

  const toggleAccess = async (friendUsername) => {
    const newAccess = sharedListAccess.includes(friendUsername)
      ? sharedListAccess.filter(f => f !== friendUsername)
      : [...sharedListAccess, friendUsername];

    try {
      const response = await fetch(`http://localhost:5000/friends/${currentUser}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedFriends: newAccess })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setSharedListAccess(data.sharedListAccess);
      setSuccess('Acces actualizat cu succes!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Eroare la actualizarea accesului');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Se încarcă...</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Gestionare Prieteni</h2>
      
      {/* Adăugare prieten nou */}
      <div className="flex gap-2 mb-6">
        <Input
          type="text"
          value={newFriend}
          onChange={(e) => setNewFriend(e.target.value)}
          placeholder="Nume utilizator"
          className="flex-1"
        />
        <Button onClick={addFriend}>
          Adaugă Prieten
        </Button>
      </div>

      {/* Mesaje de eroare și succes */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Lista de prieteni */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold mb-2">Prietenii mei</h3>
        {friends.length === 0 ? (
          <p className="text-gray-500">Nu ai niciun prieten adăugat</p>
        ) : (
          friends.map((friend) => (
            <div key={friend} className="flex items-center justify-between p-3 bg-white rounded-lg shadow">
              <span className="font-medium">{friend}</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={sharedListAccess.includes(friend)}
                    onCheckedChange={() => toggleAccess(friend)}
                  />
                  <span className="text-sm text-gray-600">
                    {sharedListAccess.includes(friend) ? 'Are acces' : 'Fără acces'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FriendsManager;