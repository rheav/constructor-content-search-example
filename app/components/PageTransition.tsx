import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useLocation } from "react-router";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isFirstRender = useRef(true);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      setShouldAnimate(true);
    }
  }, [location.pathname]);

  return (
    <motion.div
      key={location.pathname}
      initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
