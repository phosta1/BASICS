import { useEffect, useRef, useState } from "react";
import { useLogout, useIsAuthenticated } from "@refinedev/core";
import { Modal } from "antd";

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_TIMEOUT_MS = 5 * 60 * 1000; // Show warning 5 minutes before

export const useSessionTimeout = () => {
  const { mutate: logout } = useLogout();
  const { isLoading: isAuthLoading, data: authData } = useIsAuthenticated();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const modalRef = useRef<ReturnType<typeof Modal.confirm> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimeout = () => {
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    
    // Close any existing modal
    if (modalRef.current) {
      modalRef.current.destroy();
      modalRef.current = null;
    }

    setShowWarning(false);
    lastActivityRef.current = Date.now();

    // Set warning timeout (triggers 5 minutes before logout)
    warningTimeoutRef.current = setTimeout(() => {
      setShowWarning(true);
    }, SESSION_TIMEOUT_MS - WARNING_BEFORE_TIMEOUT_MS);

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      setShowWarning(false);
      // Close modal before logging out
      if (modalRef.current) {
        modalRef.current.destroy();
        modalRef.current = null;
      }
      logout();
    }, SESSION_TIMEOUT_MS);
  };

  const handleWarningResponse = (extendSession: boolean) => {
    setShowWarning(false);
    if (modalRef.current) {
      modalRef.current.destroy();
      modalRef.current = null;
    }
    
    if (extendSession) {
      resetTimeout();
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      logout();
    }
  };

  useEffect(() => {
    // Only activate timeout if user is authenticated
    if (isAuthLoading || authData === undefined) return;
    
    if (!authData) {
      // User is not authenticated, clean up
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (modalRef.current) {
        modalRef.current.destroy();
        modalRef.current = null;
      }
      return;
    }

    resetTimeout();

    // Track user activity: mouse, keyboard, touch
    const handleActivity = () => {
      resetTimeout();
    };

    const events = ["mousedown", "keydown", "touchstart", "click"];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [logout, authData, isAuthLoading]);

  // Show warning modal
  useEffect(() => {
    if (showWarning && !modalRef.current) {
      modalRef.current = Modal.confirm({
        title: "Session Expiring Soon",
        content: "Your session will expire in 5 minutes due to inactivity. Would you like to continue?",
        okText: "Continue Session",
        cancelText: "Logout",
        onOk: () => handleWarningResponse(true),
        onCancel: () => handleWarningResponse(false),
        centered: true,
        maskClosable: false,
      });
    }
  }, [showWarning]);

  return {
    resetTimeout,
    isWarningShown: showWarning,
  };
};
