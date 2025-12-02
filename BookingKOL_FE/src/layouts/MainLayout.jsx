import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { FaFacebookMessenger, FaPhoneAlt } from "react-icons/fa";
import { SiZalo } from "react-icons/si";
import Navbar from "../components/home/Navbar";
import Footer from "../components/home/Footer";

const MainLayout = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname]);

  const contactActions = [
    {
      key: "messenger",
      label: "Chat qua Messenger",
      href: "https://www.messenger.com/t/ND.Bac2001",
      icon: <FaFacebookMessenger size={26} />,
      className: "bg-gradient-to-br from-[#6a4cff] via-[#9c4aff] to-[#d94fff]",
      vrClass: "vr-messenger",
    },
    {
      key: "zalo",
      label: "Chat qua Zalo",
      href: "https://zalo.me/0379642539",
      icon: <SiZalo size={26} />,
      className: "bg-gradient-to-br from-[#0084ff] to-[#00b0ff]",
      vrClass: "vr-zalo",
    },
    {
      key: "phone",
      label: "Goi ngay",
      href: "tel:0379642539",
      icon: <FaPhoneAlt size={24} />,
      className: "bg-gradient-to-br from-[#ff1c1c] via-[#ff4444] to-[#ff6b6b]",
      vrClass: "vr-phone",
    },
  ];

  return (
    <>
      <Navbar />
      <Outlet />
      <div className="fixed bottom-6 right-4 flex flex-col gap-9 z-50">
        {contactActions.map(
          ({ key, label, href, icon, className, vrClass }) => (
            <a
              key={key}
              href={href}
              aria-label={label}
              target={key === "phone" ? "_self" : "_blank"}
              rel={key === "phone" ? undefined : "noreferrer"}
              className={`relative w-14 h-14 flex items-center justify-center ${vrClass}`}
            >
              {/* Sóng OUTER */}
              <div className="phone-vr-circle" />

              {/* Sóng INNER */}
              <div className="phone-vr-circle-fill" />

              {/* Icon + nền */}
              <div
                className={`w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg phone-vr-img-circle ${className}`}
              >
                {icon}
              </div>
            </a>
          )
        )}
      </div>

      <Footer />
    </>
  );
};

export default MainLayout;
