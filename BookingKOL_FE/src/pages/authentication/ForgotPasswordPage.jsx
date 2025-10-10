// src/pages/authentication/ForgotPasswordPage.jsx
import { useEffect, useMemo, useState } from "react";
import "./login.css";
import logo from "../../assets/logocty.png";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

// Nếu bạn có utils/config.js thì thay API_BASE bằng import từ đó
// import { API_BASE } from "../../utils/config";

export default function ForgotPasswordPage() {
  // ===== CONFIG =====
  const API_BASE = import.meta.env.VITE_API_BASE;
  const FORGOT_ENDPOINT = `${API_BASE}/api/v1/password/forgot`;
  const RESET_ENDPOINT = `${API_BASE}/api/v1/password/reset`;

  // ===== AUTH + ROUTER =====
  const { token } = useAuth?.() || {};
  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.from?.pathname || "/";

  // ✅ Nếu đã đăng nhập thì đá khỏi trang quên mật khẩu
  useEffect(() => {
    if (token) navigate(backTo, { replace: true });
  }, [token, backTo, navigate]);

  // ===== STATE =====
  const [step, setStep] = useState("REQUEST"); // "REQUEST" | "VERIFY"

  // Step 1
  const [email, setEmail] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestErr, setRequestErr] = useState("");

  // Resend OTP
  const [cooldown, setCooldown] = useState(0);

  // Step 2
  const [otp, setOtp] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyErr, setVerifyErr] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // ===== HELPERS =====
  const isEmailValid = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const strongPw = useMemo(
    () => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/.test(newPw),
    [newPw]
  );

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // ===== ACTIONS =====
  const handleRequest = async (e) => {
    e.preventDefault();
    setRequestErr("");
    setOkMsg("");

    const emailTrim = email.trim();
    if (!/\S+@\S+\.\S+/.test(emailTrim)) {
      setRequestErr("Email không hợp lệ");
      return;
    }

    setRequestLoading(true);
    try {
      const res = await fetch(FORGOT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrim }),
      });

      let data = null;
      try {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) data = await res.json();
      } catch {
        data = null;
      }

      const msg = data && (data.message || data.detail || data.error);
      const msgStr = Array.isArray(msg) ? msg.join(" ") : String(msg || "");
      const looksSuccess =
        res.ok &&
        ((data &&
          (data.success === true || data.status === 200 || data.code === 0)) ||
          /đã gửi otp|gửi otp thành công|otp đã được gửi/i.test(msgStr));

      const looksEmailNotFound =
        /không tồn tại|not exist|no such|không tìm thấy|does not exist/i.test(
          msgStr
        );

      if (!looksSuccess || looksEmailNotFound) {
        setRequestErr(
          looksEmailNotFound
            ? "Email không tồn tại. Vui lòng kiểm tra và nhập lại."
            : msgStr || `Gửi yêu cầu thất bại (HTTP ${res.status})`
        );
        return;
      }

      setStep("VERIFY");
      setOkMsg(
        msgStr ||
          "Đã gửi OTP tới email của bạn. Vui lòng kiểm tra hộp thư (kể cả Spam/Quảng cáo)."
      );
      setCooldown(60);
    } catch {
      setRequestErr("Không thể kết nối server. Kiểm tra API & CORS.");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setRequestErr("");
    setOkMsg("");
    setRequestLoading(true);
    try {
      const res = await fetch(FORGOT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg =
          (data && (data.message || data.error || data.detail)) ||
          `Gửi lại OTP thất bại (HTTP ${res.status})`;
        setRequestErr(Array.isArray(msg) ? msg.join(", ") : String(msg));
        return;
      }
      setOkMsg(
        (data &&
          (Array.isArray(data.message)
            ? data.message.join(" ")
            : data.message)) ||
          "Đã gửi lại OTP."
      );
      setCooldown(60);
    } catch {
      setRequestErr("Không thể kết nối server. Kiểm tra API & CORS.");
    } finally {
      setRequestLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setVerifyErr("");
    setOkMsg("");

    if (!otp || otp.length < 4) {
      setVerifyErr("Vui lòng nhập mã OTP hợp lệ.");
      return;
    }
    if (!strongPw) {
      setVerifyErr(
        "Mật khẩu ≥ 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt."
      );
      return;
    }
    if (newPw !== confirmPw) {
      setVerifyErr("Mật khẩu nhập lại không khớp.");
      return;
    }

    setVerifyLoading(true);
    try {
      const payload = {
        email,
        otp,
        newPassword: newPw,
        confirmPassword: confirmPw,
      };

      const res = await fetch(RESET_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msg =
          (data && (data.message || data.error || data.detail)) ||
          `Đặt lại mật khẩu thất bại (HTTP ${res.status})`;
        setVerifyErr(Array.isArray(msg) ? msg.join(" ") : String(msg));
        return;
      }

      setOkMsg(
        (data &&
          (Array.isArray(data.message)
            ? data.message.join(" ")
            : data.message)) ||
          "Đặt lại mật khẩu thành công!"
      );

      // ✅ Điều hướng về trang đăng nhập cho mượt (thay vì window.location.href)
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch {
      setVerifyErr("Không thể kết nối server. Kiểm tra API & CORS.");
    } finally {
      setVerifyLoading(false);
    }
  };

  // ===== UI =====
  return (
    <div className="login-wrap forgot-page">
      {/* LEFT */}
      <section className="left-hero">
        <div className="brand">
          <img src={logo} alt="Logo" className="logo" />
        </div>

        <h1>
          THẾ GIỚI LIVESTREAM <br /> TRONG TAY BẠN <br />
          <span className="highlight">HÃY TẬN HƯỞNG</span>
        </h1>
        <div className="stats">
          <div>
            <b>20 Triệu</b>
            <span>Số lượng quảng cáo trung bình hàng năm</span>
          </div>
          <div>
            <b>10 Triệu</b>
            <span>Số người theo dõi của người sáng tạo độc quyền</span>
          </div>
          <div>
            <b>100 tài khoản</b>
            <span>Quản lý tài khoản thương hiệu và idol</span>
          </div>
          <div>
            <b>500 Triệu</b>
            <span>Lượt xem quảng cáo đang chạy</span>
          </div>
        </div>
        <svg
          className="hero-wave transition duration-300 ease-in-out delay-150"
          width="100%"
          height="100%"
          id="svg"
          viewBox="0 0 1440 590"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <style>{`
    .path-0{
      animation: pathAnim-0 4s linear infinite;
    }
    @keyframes pathAnim-0{
      0%{
        d: path("M 0,600 L 0,150 C 65.17210580556508,188.33596702164203 130.34421161113016,226.6719340432841 203,209 C 275.65578838886984,191.3280659567159 355.7952593610443,117.64823084850566 425,83 C 494.2047406389557,48.35176915149434 552.4747509446925,52.73514256269323 627,96 C 701.5252490553075,139.26485743730677 792.3057368601857,221.41119890072142 853,218 C 913.6942631398143,214.58880109927858 944.3023016145653,125.62006183442115 1012,96 C 1079.6976983854347,66.37993816557885 1184.4850566815528,96.10855376159395 1262,115 C 1339.5149433184472,133.89144623840605 1389.7574716592235,141.94572311920302 1440,150 L 1440,600 L 0,600 Z");
      }
      25%{
        d: path("M 0,600 L 0,150 C 70.43146684987977,136.32634833390588 140.86293369975954,122.65269666781175 213,125 C 285.13706630024046,127.34730333218825 358.9797320508417,145.71556166265887 439,158 C 519.0202679491583,170.28443833734113 605.2181380968739,176.48505668155275 654,187 C 702.7818619031261,197.51494331844725 714.1477155616627,212.3442116111302 786,199 C 857.8522844383373,185.6557883888698 990.1909996564757,144.1380968739265 1062,129 C 1133.8090003435243,113.86190312607351 1145.0882858124355,125.10340089316387 1198,133 C 1250.9117141875645,140.89659910683613 1345.4558570937822,145.44829955341805 1440,150 L 1440,600 L 0,600 Z");
      }
      50%{
        d: path("M 0,600 L 0,150 C 64.12366884232222,176.5833047062865 128.24733768464444,203.166609412573 200,184 C 271.75266231535556,164.833390587427 351.1343181037445,99.91686705599449 427,97 C 502.8656818962555,94.08313294400551 575.215389900378,153.16592236344897 640,182 C 704.784610099622,210.83407763655103 762.0041222947441,209.41944349020955 822,207 C 881.9958777052559,204.58055650979045 944.7681209206457,201.15630367571285 1021,184 C 1097.2318790793543,166.84369632428715 1186.9233940226727,135.9553418069392 1259,128 C 1331.0766059773273,120.04465819306081 1385.5383029886636,135.0223290965304 1440,150 L 1440,600 L 0,600 Z");
      }
      75%{
        d: path("M 0,600 L 0,150 C 89.92511164548267,165.1721058055651 179.85022329096535,180.34421161113022 242,181 C 304.14977670903465,181.65578838886978 338.5242184816214,167.7952593610443 394,154 C 449.4757815183786,140.2047406389557 526.0529027825489,126.47475094469254 607,127 C 687.9470972174511,127.52524905530746 773.2641703881826,142.3057368601855 845,152 C 916.7358296118174,161.6942631398145 974.8904156647202,166.30230161456547 1042,148 C 1109.1095843352798,129.69769838543453 1185.174166952937,88.48505668155272 1253,85 C 1320.825833047063,81.51494331844728 1380.4129165235315,115.75747165922364 1440,150 L 1440,600 L 0,600 Z");
      }
      100%{
        d: path("M 0,600 L 0,150 C 65.17210580556508,188.33596702164203 130.34421161113016,226.6719340432841 203,209 C 275.65578838886984,191.3280659567159 355.7952593610443,117.64823084850566 425,83 C 494.2047406389557,48.35176915149434 552.4747509446925,52.73514256269323 627,96 C 701.5252490553075,139.26485743730677 792.3057368601857,221.41119890072142 853,218 C 913.6942631398143,214.58880109927858 944.3023016145653,125.62006183442115 1012,96 C 1079.6976983854347,66.37993816557885 1184.4850566815528,96.10855376159395 1262,115 C 1339.5149433184472,133.89144623840605 1389.7574716592235,141.94572311920302 1440,150 L 1440,600 L 0,600 Z");
      }
    }

    .path-1{
      animation: pathAnim-1 4s linear infinite;
    }
    @keyframes pathAnim-1{
      0%{
        d: path("M 0,600 L 0,350 C 61.220199244245975,383.3706630024046 122.44039848849195,416.7413260048093 191,422 C 259.55960151150805,427.2586739951907 335.4586052902783,404.40535898316733 399,395 C 462.5413947097217,385.59464101683267 513.725180350395,389.6372380625214 578,395 C 642.274819649605,400.3627619374786 719.6406733081416,407.0456887667468 793,391 C 866.3593266918584,374.9543112332532 935.7121264170387,336.1800068704912 1005,331 C 1074.2878735829613,325.8199931295088 1143.510821023703,354.2342837512882 1216,363 C 1288.489178976297,371.7657162487118 1364.2445894881484,360.8828581243559 1440,350 L 1440,600 L 0,600 Z");
      }
      25%{
        d: path("M 0,600 L 0,350 C 84.35314324974235,336.8258330470629 168.7062864994847,323.65166609412574 234,313 C 299.2937135005153,302.34833390587426 345.5279972518035,294.2191686705599 418,312 C 490.4720027481965,329.7808313294401 589.1817244933012,373.4716592236345 651,370 C 712.8182755066988,366.5283407763655 737.7451047749915,315.8941944349021 806,299 C 874.2548952250085,282.1058055650979 985.837856406733,298.95156303675714 1065,299 C 1144.162143593267,299.04843696324286 1190.9034695980763,282.2995534180694 1248,288 C 1305.0965304019237,293.7004465819306 1372.5482652009619,321.8502232909653 1440,350 L 1440,600 L 0,600 Z");
      }
      50%{
        d: path("M 0,600 L 0,350 C 73.00515286843009,374.24321538990034 146.01030573686018,398.48643077980074 218,372 C 289.9896942631398,345.51356922019926 360.96392992098936,268.2974922706973 433,276 C 505.03607007901064,283.7025077293027 578.1339745791824,376.3236001374098 645,399 C 711.8660254208176,421.6763998625902 772.500171762281,374.4081071796633 836,339 C 899.499828237719,303.5918928203367 965.8653383716935,280.0439711439368 1040,280 C 1114.1346616283065,279.9560288560632 1196.0384747509445,303.4160082445895 1264,319 C 1331.9615252490555,334.5839917554105 1385.9807626245279,342.2919958777053 1440,350 L 1440,600 L 0,600 Z");
      }
      75%{
        d: path("M 0,600 L 0,350 C 87.32050841635177,326.9220199244246 174.64101683270354,303.8440398488492 238,319 C 301.35898316729646,334.1559601511508 340.7564410855376,387.5458605290279 390,375 C 439.2435589144624,362.4541394709721 498.333218825146,283.97251803503946 582,298 C 665.666781174854,312.02748196496054 773.9106836138785,418.5640673308142 838,414 C 902.0893163861215,409.4359326691858 922.0240467193403,293.77121264170387 992,289 C 1061.9759532806597,284.22878735829613 1181.99312950876,390.35108210237036 1265,419 C 1348.00687049124,447.64891789762964 1394.00343524562,398.8244589488148 1440,350 L 1440,600 L 0,600 Z");
      }
      100%{
        d: path("M 0,600 L 0,350 C 61.220199244245975,383.3706630024046 122.44039848849195,416.7413260048093 191,422 C 259.55960151150805,427.2586739951907 335.4586052902783,404.40535898316733 399,395 C 462.5413947097217,385.59464101683267 513.725180350395,389.6372380625214 578,395 C 642.274819649605,400.3627619374786 719.6406733081416,407.0456887667468 793,391 C 866.3593266918584,374.9543112332532 935.7121264170387,336.1800068704912 1005,331 C 1074.2878735829613,325.8199931295088 1143.510821023703,354.2342837512882 1216,363 C 1288.489178976297,371.7657162487118 1364.2445894881484,360.8828581243559 1440,350 L 1440,600 L 0,600 Z");
      }
    }
  `}</style>

          <defs>
            <linearGradient id="gradient" x1="3%" y1="33%" x2="97%" y2="67%">
              <stop offset="5%" stopColor="#8de2ed"></stop>
              <stop offset="95%" stopColor="#4a74da"></stop>
            </linearGradient>
          </defs>

          {/* Lớp sóng trên — nhạt */}
          <path
            className="path-0"
            d="M 0,600 L 0,150 C 65.17210580556508,188.33596702164203 130.34421161113016,226.6719340432841 203,209 C 275.65578838886984,191.3280659567159 355.7952593610443,117.64823084850566 425,83 C 494.2047406389557,48.35176915149434 552.4747509446925,52.73514256269323 627,96 C 701.5252490553075,139.26485743730677 792.3057368601857,221.41119890072142 853,218 C 913.6942631398143,214.58880109927858 944.3023016145653,125.62006183442115 1012,96 C 1079.6976983854347,66.37993816557885 1184.4850566815528,96.10855376159395 1262,115 C 1339.5149433184472,133.89144623840605 1389.7574716592235,141.94572311920302 1440,150 L 1440,600 L 0,600 Z"
            stroke="none"
            strokeWidth="0"
            fill="url(#gradient)"
            fillOpacity="0.53"
          />

          {/* Lớp sóng dưới — đậm */}
          <path
            className="path-1"
            d="M 0,600 L 0,350 C 61.220199244245975,383.3706630024046 122.44039848849195,416.7413260048093 191,422 C 259.55960151150805,427.2586739951907 335.4586052902783,404.40535898316733 399,395 C 462.5413947097217,385.59464101683267 513.725180350395,389.6372380625214 578,395 C 642.274819649605,400.3627619374786 719.6406733081416,407.0456887667468 793,391 C 866.3593266918584,374.9543112332532 935.7121264170387,336.1800068704912 1005,331 C 1074.2878735829613,325.8199931295088 1143.510821023703,354.2342837512882 1216,363 C 1288.489178976297,371.7657162487118 1364.2445894881484,360.8828581243559 1440,350 L 1440,600 L 0,600 Z"
            stroke="none"
            strokeWidth="0"
            fill="url(#gradient)"
            fillOpacity="1"
          />
        </svg>
      </section>

      {/* RIGHT */}
      <section className="right-card">
        <div className="login-header">
          <img src={logo} alt="Logo" className="login-logo-top" />
          <h2 className="login-title">Quên mật khẩu</h2>
          <p className="login-sub">
            {step === "REQUEST"
              ? "Nhập email đã đăng ký để nhận mã OTP."
              : "Nhập mã OTP và đặt lại mật khẩu mới."}
          </p>
        </div>

        {step === "REQUEST" ? (
          <form className="form" onSubmit={handleRequest} noValidate>
            {requestErr && <p className="err-msg">{requestErr}</p>}

            <label className="lbl">Email</label>
            <input
              className="input"
              type="email"
              placeholder="Email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button
              className="primary-btn"
              type="submit"
              disabled={requestLoading}
            >
              {requestLoading ? "Đang gửi..." : "Gửi OTP"}
            </button>

            <div className="divider">
              <span>Hoặc</span>
            </div>
            <div className="register-link">
              Nhớ mật khẩu rồi? <a href="/login">Đăng nhập</a>
            </div>
          </form>
        ) : (
          <form className="form" onSubmit={handleVerify} noValidate>
            {okMsg && (
              <div
                className="alert alert-success"
                style={{ maxWidth: 420, margin: "0 auto" }}
              >
                ✅ {okMsg}
                <div className="muted-note">
                  OTP đã được gửi tới <b>{email}</b>. Nếu không thấy, vui lòng
                  kiểm tra Spam/Quảng cáo.
                </div>
              </div>
            )}
            {verifyErr && <p className="err-msg">{verifyErr}</p>}

            <label className="lbl">Mã OTP</label>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={6}
              placeholder="Nhập mã 6 số"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
            />

            <label className="lbl">Mật khẩu mới</label>
            <input
              className="input"
              type="password"
              placeholder="Tạo mật khẩu mạnh"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
            />
            {!strongPw && newPw && (
              <p className="err-msg">
                Mật khẩu ≥ 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc
                biệt.
              </p>
            )}

            <label className="lbl">Nhập lại mật khẩu mới</label>
            <input
              className="input"
              type="password"
              placeholder="Nhập lại mật khẩu"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
            />
            {confirmPw && newPw !== confirmPw && (
              <p className="err-msg">Mật khẩu nhập lại không khớp.</p>
            )}

            <button
              className="primary-btn"
              type="submit"
              disabled={verifyLoading}
            >
              {verifyLoading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
            </button>

            <div className="divider">
              <span>Hoặc</span>
            </div>

            <div className="register-link">
              Không nhận được OTP?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={requestLoading || cooldown > 0}
                style={{
                  background: "transparent",
                  border: 0,
                  color: "#37a25a",
                  fontWeight: 600,
                  cursor: cooldown > 0 ? "not-allowed" : "pointer",
                }}
              >
                {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại OTP"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
