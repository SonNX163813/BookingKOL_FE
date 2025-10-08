import React from "react";
import { Link } from "react-router-dom";
import logoPng from "../../assets/logocty.png";

import email from "../../assets/email.png";
import phone from "../../assets/phone.png";
import instagram from "../../assets/instagram.png";
import tiktok from "../../assets/tiktok.png";
import clsx from "clsx";
import { FaFacebook } from "react-icons/fa";

const FooterLink = ({ to, children }) => (
  <li>
    <Link to={to} className="hover:text-blue-800 transition-colors !text-sm">
      {children}
    </Link>
  </li>
);

function ScrollButton({
  as: Component = "button",
  className,
  children,
  ...props
}) {
  return (
    <li>
      <Component
        className={clsx(
          "cursor-pointer hover:text-blue-800 transition-colors !text-sm text-left",
          className
        )}
        {...props}
      >
        {children}
      </Component>
    </li>
  );
}

function Footer() {
  return (
    // ✅ gradient phủ full width ở chính thẻ footer
    <footer className="radial-bg-footer py-16 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* Nội dung vẫn nằm trong container để giữ max-width như trước */}
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Cột 1: Logo + slogan (dịch trái nhẹ) */}
        <div className="md:col-span-2 lg:col-span-1 lg:-ml-5 xl:-ml-8">
          {/* thêm space-y để giãn đều 3 phần; leading để giãn dòng trong mỗi đoạn */}
          <div className="flex flex-col items-start space-y-4 md:space-y-5">
            <img src={logoPng} alt="Planier" className="h-12 w-auto" />

            <p className="font-bold text-[#3658b8] text-[18px] md:text-[18px]">
              NEXUS AGENCY - Livestream All-in-One
            </p>

            <p className="text-sm leading-[1.5] max-w-[520px]">
              Nền tảng dịch vụ livestream all-in-one: setup – đào tạo – booking
              – vận hành – affiliate/MCN.
              <br />
              Nexus Agency là đơn vị tiên phong cung cấp giải pháp KOL/KOC
              Marketing &amp; Livestream Commerce trọn gói tại Việt Nam.
            </p>

            <p className="text-sm leading-[1.15] -mt-1 max-w-[520px]"></p>
          </div>
        </div>

        {/* Cột 2: Giới thiệu & CSKH */}
        <div className="lg:ml-[110px]">
          <h4 className="!mb-4 font-semibold text-[#3658b8]">Giới thiệu</h4>
          <ul className="flex flex-col !space-y-3">
            <FooterLink to="/home">Về Nexus Agency</FooterLink>
            <li>
              <p className="!text-sm">Đối tác</p>
            </li>
            <li>
              <p className="!text-sm">Tuyển dụng</p>
            </li>
          </ul>

          <h4 className="!mb-4 !mt-6 font-semibold text-[#3658b8]">
            Chăm sóc khách hàng
          </h4>

          <ul className="!space-y-3">
            <ScrollButton as="a" href="#faq-container">
              Câu hỏi thường gặp
            </ScrollButton>
            <FooterLink to="/terms-and-privacy">
              Điều khoản & Chính sách
            </FooterLink>
          </ul>
        </div>

        {/* Cột 3: Các Gói Dịch Vụ */}
        <div className="lg:ml-[90px]">
          <h4 className="mb-4 font-semibold text-[#3658b8]">Các Gói Dịch Vụ</h4>
          <ul className="space-y-3">
            <ScrollButton as="a" href="#features-container">
              Dịch vụ LiveStream chuyên nghiệp
            </ScrollButton>
            <ScrollButton as="a" href="#pricing-container">
              Dịch vụ đào tạo LiveStream
            </ScrollButton>
            <ScrollButton as="a" href="#pricing-container">
              Blog
            </ScrollButton>
            <ScrollButton as="a" href="#guide-container">
              Trợ lý ảo AI
            </ScrollButton>
            <ScrollButton as="a" href="#guide-container">
              Liên hệ tư vấn
            </ScrollButton>
          </ul>
        </div>

        {/* Cột 4: Liên hệ */}
        <div className="lg:ml-[90px]">
          <h4 className="mb-4 font-semibold text-[#3658b8]">Liên hệ</h4>
          <ul className="space-y-4">
            <li className="flex items-center gap-3">
              <img src={email} alt="email" className="!w-[20px]" />
              <a
                href="mailto:info.planier@gmail.com"
                className="text-sm hover:text-blue-800"
              >
                Email: info.planier@gmail.com
              </a>
            </li>
            <li className="flex items-center gap-3">
              <img src={phone} alt="phone" className="!w-[20px]" />
              <a href="tel:0702260606" className="text-sm hover:text-blue-800">
                Hotline: 0379 642 539
              </a>
            </li>
            <li className="flex items-center gap-3">
              <FaFacebook size={21} className="mr-[1px]" />
              <a
                href="https://www.facebook.com/planier.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:text-blue-800"
              >
                Facebook
              </a>
            </li>
            <li className="flex items-center gap-3">
              <img src={instagram} alt="instagram" className="!w-[20px]" />
              <a
                href="https://www.instagram.com/planier.vn/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:text-blue-800"
              >
                Instagram
              </a>
            </li>
            <li className="flex items-center gap-3">
              <img src={tiktok} alt="tiktok" className="!w-[18px]" />
              <a
                href="https://www.tiktok.com/@planier.vn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm hover:text-blue-800"
              >
                Tiktok
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
