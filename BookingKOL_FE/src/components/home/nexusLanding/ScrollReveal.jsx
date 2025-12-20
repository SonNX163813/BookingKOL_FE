import React from "react";
import { motion, useReducedMotion } from "framer-motion";

const ScrollReveal = ({
  children,
  once = true,
  amount = 0.25, // % section xuất hiện trong viewport thì trigger
  y = 20,
  duration = 0.5,
  delay = 0,
}) => {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{
        duration: reduce ? 0 : duration,
        delay: reduce ? 0 : delay,
        ease: "easeOut",
      }}
      style={{ width: "100%" }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
