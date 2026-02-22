import { useState, useCallback } from 'react';
import { useCredits } from '@/contexts/CreditsContext';
import { useAuth } from '@/contexts/AuthContext';
import { FEATURE_PRICES } from '@/lib/credits';
import { useNavigate } from 'react-router-dom';

export function useCreditCheck() {
  const { balance, refreshBalance } = useCredits();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showInsufficientDialog, setShowInsufficientDialog] = useState(false);
  const [requiredAmount, setRequiredAmount] = useState(0);
  const [featureName, setFeatureName] = useState('');

  const checkCredits = useCallback((featureCode: string, costOverride?: number): boolean => {
    const feature = FEATURE_PRICES[featureCode];
    if (!feature) return true; // unknown feature, allow
    if (feature.billing === 'token') {
      // token 计费需要登录，未登录跳转到登录页
      if (!user) {
        navigate('/login');
        return false;
      }
      return true;
    }

    const cost = costOverride ?? feature.cost;
    if (balance !== null && balance >= cost) {
      return true;
    }

    setRequiredAmount(cost);
    setFeatureName(feature.name);
    setShowInsufficientDialog(true);
    return false;
  }, [balance, user, navigate]);

  const goToRecharge = useCallback(() => {
    setShowInsufficientDialog(false);
    navigate('/recharge');
  }, [navigate]);

  const dismissDialog = useCallback(() => {
    setShowInsufficientDialog(false);
  }, []);

  return {
    checkCredits,
    showInsufficientDialog,
    requiredAmount,
    featureName,
    currentBalance: balance ?? 0,
    goToRecharge,
    dismissDialog,
    refreshBalance,
  };
}
