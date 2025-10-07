import { useEffect, useState } from 'react';
import { database } from '@/lib/firebase';
import { ref, query, orderByChild, equalTo, get } from 'firebase/database';
import { useAuth } from '@/context/AuthContext';
import { User } from '@/context/AuthContext';

export const useMatchmaking = () => {
  const { user } = useAuth();
  const [potentialMatches, setPotentialMatches] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPotentialMatches = async () => {
      try {
        const usersRef = ref(database, 'users');
        
        // Query users based on gender preference
        const genderQuery = query(
          usersRef,
          orderByChild('gender'),
          equalTo(user.lookingFor)
        );

        const snapshot = await get(genderQuery);
        
        if (snapshot.exists()) {
          const users = snapshot.val();
          const matches = Object.values(users)
            .filter((potentialMatch: User) => {
              // Filter out the current user
              if (potentialMatch.id === user.id) return false;
              
              // Check if the potential match is looking for users of the current user's gender
              if (potentialMatch.lookingFor === 'All') return true;
              return potentialMatch.lookingFor === user.gender;
            }) as User[];

          setPotentialMatches(matches);
        } else {
          setPotentialMatches([]);
        }
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPotentialMatches();
  }, [user]);

  return {
    potentialMatches,
    loading,
  };
};