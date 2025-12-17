import { useState, useEffect, useMemo, useRef } from "react";
import "./login.css"; // style chung (login + register)
import "./register.css"; // style riêng cho Register
import logo from "../../assets/logocty.png";
import googleLogo from "../../assets/google_logo.svg.png";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE, BASE_URL } from "../../utils/config"; // ✅ dùng chung như Login

export default function RegisterPage() {
  const MAX_PWD = 255;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [agree, setAgree] = useState(true);

  const [errors, setErrors] = useState({});
  const [serverErr, setServerErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 👀 toggle hiện/ẩn mật khẩu
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 👇 chỉ hiển thị popup gợi ý khi input mật khẩu đang được focus
  const [showHints, setShowHints] = useState(false);
  const pwdInputRef = useRef(null);

  const auth = useAuth?.() || {};
  const { token, dispatch = () => {} } = auth;

  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.from?.pathname || "/";

  // ================= GOOGLE OAUTH CALLBACK (GIỐNG LOGIN) ================= //
  useEffect(() => {
    if (token) return; // đã có token thì không xử lý lại

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const rawUserData = params.get("user_data");

    if (!accessToken || !rawUserData) return;

    let parsedUser = null;
    try {
      const decodedUserData = decodeURIComponent(rawUserData);
      parsedUser = JSON.parse(decodedUserData);
    } catch (err) {
      parsedUser = null;
    }

    const user = {
      id: parsedUser?.id ?? null,
      email: parsedUser?.email ?? "",
      roles: parsedUser?.roles ?? [],
    };

    try {
      sessionStorage.setItem("auth_token", accessToken);
      sessionStorage.setItem("auth_user", JSON.stringify(user));
    } catch (err) {
      // ignore storage errors
    }

    dispatch({
      type: "LOGIN_SUCCESS",
      payload: {
        user,
        token: accessToken,
        roles: user.roles,
        remember: false, // giống LoginPage khi login bằng Google
      },
    });

    // xoá query trên URL sau khi xử lý
    const cleanedUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({}, "", cleanedUrl);

    // sau khi đăng ký + login bằng Google → vào trang chủ (giống Login)
    navigate("/", { replace: true });
  }, [dispatch, navigate, token]);
  // ======================================================================= //

  // ✅ Nếu đã đăng nhập (có token), tự điều hướng khỏi trang register
  useEffect(() => {
    if (token) {
      navigate(backTo, { replace: true });
    }
  }, [token, backTo, navigate]);

  // ====== PASSWORD RULES / HINTS ======
  const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;

  const pwdRules = useMemo(() => {
    const len = password.length >= 8;
    const lower = /[a-z]/.test(password);
    const upper = /[A-Z]/.test(password);
    const digit = /\d/.test(password);
    const special = /[^\da-zA-Z]/.test(password);
    const passed = [len, lower, upper, digit, special].filter(Boolean).length;
    return { len, lower, upper, digit, special, passed };
  }, [password]);

  const strengthLabel = useMemo(() => {
    if (!password) return "";
    if (pwdRules.passed <= 2) return "Yếu";
    if (pwdRules.passed <= 4) return "Trung bình";
    return "Mạnh";
  }, [password, pwdRules.passed]);

  const strengthPercent = useMemo(
    () => (password ? (pwdRules.passed / 5) * 100 : 0),
    [password, pwdRules.passed]
  );

  async function safeJson(res) {
    let raw = "";
    try {
      raw = await res.text();
      return { data: raw ? JSON.parse(raw) : null, raw };
    } catch {
      return { data: null, raw };
    }
  }

  // ================== LIMIT 255 + SHOW MESSAGE + BLOCK INPUT ==================
  const clearMaxLenErrorIfNeeded = (field) => {
    const msg = `Mật khẩu tối đa ${MAX_PWD} ký tự`;
    setErrors((prev) => {
      if (prev?.[field] === msg) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return prev;
    });
  };

  const setPwdWithLimit = (nextValue) => {
    if (nextValue.length > MAX_PWD) {
      setPassword(nextValue.slice(0, MAX_PWD));
      setErrors((prev) => ({
        ...prev,
        password: `Mật khẩu tối đa ${MAX_PWD} ký tự`,
      }));
      return;
    }
    setPassword(nextValue);
    if (nextValue.length < MAX_PWD) clearMaxLenErrorIfNeeded("password");
  };

  const setConfirmWithLimit = (nextValue) => {
    if (nextValue.length > MAX_PWD) {
      setConfirm(nextValue.slice(0, MAX_PWD));
      setErrors((prev) => ({
        ...prev,
        confirm: `Mật khẩu tối đa ${MAX_PWD} ký tự`,
      }));
      return;
    }
    setConfirm(nextValue);
    if (nextValue.length < MAX_PWD) clearMaxLenErrorIfNeeded("confirm");
  };

  // Chặn gõ thêm khi đã đủ 255 (trừ các phím điều hướng/xoá)
  const blockWhenMax = (e, value, field) => {
    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
      "Tab",
    ];
    if (allowedKeys.includes(e.key)) return;

    const hasSelection =
      e.currentTarget.selectionStart !== e.currentTarget.selectionEnd;

    const ctrlCmd = e.ctrlKey || e.metaKey;
    if (ctrlCmd) return; // cho copy/cut/select all...

    if (value.length >= MAX_PWD && !hasSelection) {
      e.preventDefault();
      setErrors((prev) => ({
        ...prev,
        [field]: `Mật khẩu tối đa ${MAX_PWD} ký tự`,
      }));
    }
  };

  // Chặn paste vượt quá 255 (và tự cắt phần paste để đủ 255)
  const handlePasteLimit = (e, value, field) => {
    const paste = e.clipboardData.getData("text") || "";
    const input = e.currentTarget;

    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;

    const nextLen = value.length - (end - start) + paste.length;

    if (nextLen > MAX_PWD) {
      e.preventDefault();

      const keep = MAX_PWD - (value.length - (end - start));
      const pastedPart = paste.slice(0, Math.max(0, keep));
      const nextValue = value.slice(0, start) + pastedPart + value.slice(end);

      if (field === "password") setPwdWithLimit(nextValue);
      else setConfirmWithLimit(nextValue);

      setErrors((prev) => ({
        ...prev,
        [field]: `Mật khẩu tối đa ${MAX_PWD} ký tự`,
      }));
    }
  };
  // ===========================================================================

  const validate = () => {
    const next = {};

    if (!fullName.trim()) next.fullName = "Vui lòng nhập họ tên";

    if (!email.trim()) next.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = "Email không hợp lệ";

    // ✅ max length 255 (để chắc chắn)
    if (password.length > MAX_PWD)
      next.password = `Mật khẩu tối đa ${MAX_PWD} ký tự`;
    if (confirm.length > MAX_PWD)
      next.confirm = `Mật khẩu tối đa ${MAX_PWD} ký tự`;

    if (!next.password && !strong.test(password)) {
      next.password =
        "Mật khẩu ≥ 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt";
    }

    if (confirm !== password) next.confirm = "Mật khẩu nhập lại không khớp";
    if (!agree) next.agree = "Bạn cần đồng ý Điều khoản & Riêng tư";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerErr("");
    if (!validate()) return;

    setSubmitting(true);

    const url = `${API_BASE}/v1/register/brand`;
    const payload = { email, password, fullName };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const { data, raw } = await safeJson(res);

      if (!res.ok) {
        const msgRaw =
          (Array.isArray(data?.message) ? data.message[0] : data?.message) ||
          data?.error ||
          data?.detail ||
          (raw && raw.includes("<html")
            ? "Máy chủ trả HTML/redirect. Hãy trả JSON 4xx với message cụ thể."
            : "") ||
          `Đăng ký thất bại (HTTP ${res.status}).`;

        const finalMsg = String(msgRaw || "").includes(
          "Full authentication is required"
        )
          ? "Endpoint /v1/register/brand cần permitAll() trong Spring Security, hoặc kiểm tra cấu hình auth/token."
          : msgRaw;

        setServerErr(String(finalMsg || "Đăng ký thất bại."));

        const fieldErr =
          data?.errors || data?.fieldErrors || data?.validationErrors || null;
        if (fieldErr && typeof fieldErr === "object") {
          setErrors((prev) => ({ ...prev, ...fieldErr }));
        }

        setSubmitting(false);
        return;
      }

      const search = new URLSearchParams({ email });
      navigate(`/verify-email?${search.toString()}`, { replace: true });
    } catch (err) {
      setServerErr("Không thể kết nối server. Kiểm tra API đang chạy & CORS.");
      setSubmitting(false);
    }
  };

  // ✅ Google đăng ký: dùng cùng endpoint như Login
  const handleGoogleSignup = () => {
    window.location.href = `${BASE_URL}/v1/oauth2/authorization/google`;
  };

  // ===== Inline SVG Icons (không cần lib) =====
  const EyeIcon = ({ size = 20 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
  const EyeOffIcon = ({ size = 20 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3l18 18M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.12-.88M9.88 4.24A10.94 10.94 0 0 1 12 4c6.5 0 10 6 10 6a18.5 18.5 0 0 1-4.21 4.69M6.11 6.11C3.72 7.87 2 10 2 10s3.5 6 10 6c1.07 0 2.09-.16 3.04-.45"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const CheckIcon = ({ size = 16 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
  const CrossIcon = ({ size = 16 }) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const RuleItem = ({ ok, text }) => (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: ok ? "#16a34a" : "#64748b",
        fontSize: 13,
        lineHeight: 1.3,
      }}
    >
      <span
        style={{
          display: "inline-flex",
          width: 18,
          height: 18,
          borderRadius: "999px",
          background: ok ? "rgba(22,163,74,.1)" : "rgba(100,116,139,.12)",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-hidden="true"
      >
        {ok ? <CheckIcon size={14} /> : <CrossIcon size={14} />}
      </span>
      <span>{text}</span>
    </li>
  );

  return (
    <div className="login-wrap register-page">
      {/* LEFT */}
      <section className="left-hero">
        <div className="brand">
          <a href="/">
            <img src={logo} alt="Logo" className="logo" />
          </a>
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

        {/* SVG wave giữ nguyên của bạn */}
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
            .path-0{ animation: pathAnim-0 4s linear infinite; }
            @keyframes pathAnim-0{
              0%{ d: path("M 0,600 L 0,150 C 65.17210580556508,188.33596702164203 130.34421161113016,226.6719340432841 203,209 C 275.65578838886984,191.3280659567159 355.7952593610443,117.64823084850566 425,83 C 494.2047406389557,48.35176915149434 552.4747509446925,52.73514256269323 627,96 C 701.5252490553075,139.26485743730677 792.3057368601857,221.41119890072142 853,218 C 913.6942631398143,214.58880109927858 944.3023016145653,125.62006183442115 1012,96 C 1079.6976983854347,66.37993816557885 1184.4850566815528,96.10855376159395 1262,115 C 1339.5149433184472,133.89144623840605 1389.7574716592235,141.94572311920302 1440,150 L 1440,600 L 0,600 Z"); }
              25%{ d: path("M 0,600 L 0,150 C 70.43146684987977,136.32634833390588 140.86293369975954,122.65269666781175 213,125 C 285.13706630024046,127.34730333218825 358.9797320508417,145.71556166265887 439,158 C 519.0202679491583,170.28443833734113 605.2181380968739,176.48505668155275 654,187 C 702.7818619031261,197.51494331844725 714.1477155616627,212.3442116111302 786,199 C 857.8522844383373,185.6557883888698 990.1909996564757,144.1380968739265 1062,129 C 1133.8090003435243,113.86190312607351 1145.0882858124355,125.10340089316387 1198,133 C 1250.9117141875645,140.89659910683613 1345.4558570937822,145.44829955341805 1440,150 L 1440,600 L 0,600 Z"); }
              50%{ d: path("M 0,600 L 0,150 C 64.12366884232222,176.5833047062865 128.24733768464444,203.166609412573 200,184 C 271.75266231535556,164.833390587427 351.1343181037445,99.91686705599449 427,97 C 502.8656818962555,94.08313294400551 575.215389900378,153.16592236344897 640,182 C 704.784610099622,210.83407763655103 762.0041222947441,209.41944349020955 822,207 C 881.9958777052559,204.58055650979045 944.7681209206457,201.15630367571285 1021,184 C 1097.2318790793543,166.84369632428715 1186.9233940226727,135.9553418069392 1259,128 C 1331.0766059773273,120.04465819306081 1385.5383029886636,135.0223290965304 1440,150 L 1440,600 L 0,600 Z"); }
              75%{ d: path("M 0,600 L 0,150 C 89.92511164548267,165.1721058055651 179.85022329096535,180.34421161113022 242,181 C 304.14977670903465,181.65578838886978 338.5242184816214,167.7952593610443 394,154 C 449.4757815183786,140.2047406389557 526.0529027825489,126.47475094469254 607,127 C 687.9470972174511,127.52524905530746 773.2641703881826,142.3057368601855 845,152 C 916.7358296118174,161.6942631398145 974.8904156647202,166.30230161456547 1042,148 C 1109.1095843352798,129.69769838543453 1185.174166952937,88.48505668155272 1253,85 C 1320.825833047063,81.51494331844728 1380.4129165235315,115.75747165922364 1440,150 L 1440,600 L 0,600 Z"); }
              100%{ d: path("M 0,600 L 0,150 C 65.17210580556508,188.33596702164203 130.34421161113016,226.6719340432841 203,209 C 275.65578838886984,191.3280659567159 355.7952593610443,117.64823084850566 425,83 C 494.2047406389557,48.35176915149434 552.4747509446925,52.73514256269323 627,96 C 701.5252490553075,139.26485743730677 792.3057368601857,221.41119890072142 853,218 C 913.6942631398143,214.58880109927858 944.3023016145653,125.62006183442115 1012,96 C 1079.6976983854347,66.37993816557885 1184.4850566815528,96.10855376159395 1262,115 C 1339.5149433184472,133.89144623840605 1389.7574716592235,141.94572311920302 1440,150 L 1440,600 L 0,600 Z"); }
            }
            .path-1{ animation: pathAnim-1 4s linear infinite; }
            @keyframes pathAnim-1{
              0%{ d: path("M 0,600 L 0,350 C 61.220199244245975,383.3706630024046 122.44039848849195,416.7413260048093 191,422 C 259.55960151150805,427.2586739951907 335.4586052902783,404.40535898316733 399,395 C 462.5413947097217,385.59464101683267 513.725180350395,389.6372380625214 578,395 C 642.274819649605,400.3627619374786 719.6406733081416,407.0456887667468 793,391 C 866.3593266918584,374.9543112332532 935.7121264170387,336.1800068704912 1005,331 C 1074.2878735829613,325.8199931295088 1143.510821023703,354.2342837512882 1216,363 C 1288.489178976297,371.7657162487118 1364.2445894881484,360.8828581243559 1440,350 L 1440,600 L 0,600 Z"); }
              25%{ d: path("M 0,600 L 0,350 C 84.35314324974235,336.8258330470629 168.7062864994847,323.65166609412574 234,313 C 299.2937135005153,302.34833390587426 345.5279972518035,294.2191686705599 418,312 C 490.4720027481965,329.7808313294401 589.1817244933012,373.4716592236345 651,370 C 712.8182755066988,366.5283407763655 737.7451047749915,315.8941944349021 806,299 C 874.2548952250085,282.1058055650979 985.837856406733,298.95156303675714 1065,299 C 1144.162143593267,299.04843696324286 1190.9034695980763,282.2995534180694 1248,288 C 1305.0965304019237,293.7004465819306 1372.5482652009619,321.8502232909653 1440,350 L 1440,600 L 0,600 Z"); }
              50%{ d: path("M 0,600 L 0,350 C 73.00515286843009,374.24321538990034 146.01030573686018,398.48643077980074 218,372 C 289.9896942631398,345.51356922019926 360.96392992098936,268.2974922706973 433,276 C 505.03607007901064,283.7025077293027 578.1339745791824,376.3236001374098 645,399 C 711.8660254208176,421.6763998625902 772.500171762281,374.4081071796633 836,339 C 899.499828237719,303.5918928203367 965.8653383716935,280.0439711439368 1040,280 C 1114.1346616283065,279.9560288560632 1196.0384747509445,303.4160082445895 1264,319 C 1331.9615252490555,334.5839917554105 1385.9807626245279,342.2919958777053 1440,350 L 1440,600 L 0,600 Z"); }
              75%{ d: path("M 0,600 L 0,350 C 87.32050841635177,326.9220199244246 174.64101683270354,303.8440398488492 238,319 C 301.35898316729646,334.1559601511508 340.7564410855376,387.5458605290279 390,375 C 439.2435589144624,362.4541394709721 498.333218825146,283.97251803503946 582,298 C 665.666781174854,312.02748196496054 773.9106836138785,418.5640673308142 838,414 C 902.0893163861215,409.4359326691858 922.0240467193403,293.77121264170387 992,289 C 1061.9759532806597,284.22878735829613 1181.99312950876,390.35108210237036 1265,419 C 1348.00687049124,447.64891789762964 1394.00343524562,398.8244589488148 1440,350 L 1440,600 L 0,600 Z"); }
              100%{ d: path("M 0,600 L 0,350 C 61.220199244245975,383.3706630024046 122.44039848849195,416.7413260048093 191,422 C 259.55960151150805,427.2586739951907 335.4586052902783,404.40535898316733 399,395 C 462.5413947097217,385.59464101683267 513.725180350395,389.6372380625214 578,395 C 642.274819649605,400.3627619374786 719.6406733081416,407.0456887667468 793,391 C 866.3593266918584,374.9543112332532 935.7121264170387,336.1800068704912 1005,331 C 1074.2878735829613,325.8199931295088 1143.510821023703,354.2342837512882 1216,363 C 1288.489178976297,371.7657162487118 1364.2445894881484,360.8828581243559 1440,350 L 1440,600 L 0,600 Z"); }
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
      <section className="right-card register">
        <div className="login-header">
          <a href="/">
            <img src={logo} alt="Logo" className="login-logo-top" />
          </a>
          <h2 className="login-title">Đăng ký</h2>
          <p className="login-sub">Tạo tài khoản để bắt đầu khám phá.</p>
        </div>

        {serverErr && (
          <p className="err-msg" style={{ marginTop: 8, marginLeft: 100 }}>
            {serverErr}
          </p>
        )}

        <form className="form" onSubmit={handleSubmit} noValidate>
          {/* Họ tên */}
          <label className="lbl">Họ và tên</label>
          <input
            className={`input ${errors.fullName ? "input-error" : ""}`}
            type="text"
            placeholder="Họ và Tên của bạn"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          {errors.fullName && <p className="err-msg">{errors.fullName}</p>}

          {/* Email */}
          <label className="lbl">Email</label>
          <input
            className={`input ${errors.email ? "input-error" : ""}`}
            type="email"
            placeholder="Email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {errors.email && <p className="err-msg">{errors.email}</p>}

          {/* Mật khẩu */}
          <label className="lbl">Mật khẩu</label>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              ref={pwdInputRef}
              className={`input ${errors.password ? "input-error" : ""}`}
              type={showPwd ? "text" : "password"}
              placeholder="Tạo mật khẩu mạnh"
              value={password}
              onChange={(e) => setPwdWithLimit(e.target.value)}
              onKeyDown={(e) => blockWhenMax(e, password, "password")}
              onPaste={(e) => handlePasteLimit(e, password, "password")}
              required
              maxLength={MAX_PWD}
              style={{ paddingRight: 44 }}
              onFocus={() => setShowHints(true)}
              onBlur={() => setShowHints(false)}
              aria-describedby={showHints ? "pwd-hints" : undefined}
            />
            <button
              type="button"
              // tránh mất focus input → popup không tắt khi bấm mắt
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setShowPwd((s) => !s);
                requestAnimationFrame(() => pwdInputRef.current?.focus());
              }}
              aria-label={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              title={showPwd ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                height: 32,
                width: 32,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
              }}
            >
              {showPwd ? <EyeOffIcon /> : <EyeIcon />}
            </button>

            {/* POPUP gợi ý: chỉ hiện khi focus */}
            {showHints && (
              <div
                id="pwd-hints"
                role="alert"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  zIndex: 10,
                  minWidth: 280,
                  maxWidth: "min(420px, 92vw)",
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid rgba(148,163,184,.35)",
                  background: "white",
                  boxShadow:
                    "0 10px 30px rgba(2,6,23,0.08), 0 6px 12px rgba(2,6,23,0.06)",
                }}
              >
                {/* mũi tên nhỏ */}
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: -6,
                    left: 14,
                    width: 10,
                    height: 10,
                    background: "white",
                    borderLeft: "1px solid rgba(148,163,184,.35)",
                    borderTop: "1px solid rgba(148,163,184,.35)",
                    transform: "rotate(45deg)",
                  }}
                />
                {/* thanh strength */}
                <div
                  aria-live="polite"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 999,
                      background: "rgba(148,163,184,0.25)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${strengthPercent}%`,
                        height: "100%",
                        transition: "width .25s ease",
                        background:
                          pwdRules.passed <= 2
                            ? "#ef4444"
                            : pwdRules.passed <= 4
                            ? "#f59e0b"
                            : "#22c55e",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      minWidth: 80,
                      textAlign: "right",
                      fontSize: 12,
                      color:
                        pwdRules.passed <= 2
                          ? "#ef4444"
                          : pwdRules.passed <= 4
                          ? "#f59e0b"
                          : "#16a34a",
                    }}
                  >
                    {strengthLabel}
                  </span>
                </div>

                {/* checklist */}
                <ul
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    margin: 0,
                    padding: 0,
                    listStyle: "none",
                  }}
                >
                  <RuleItem ok={pwdRules.len} text="Tối thiểu 8 ký tự" />
                  <RuleItem
                    ok={pwdRules.lower}
                    text="Ít nhất 1 chữ thường (a–z)"
                  />
                  <RuleItem
                    ok={pwdRules.upper}
                    text="Ít nhất 1 chữ hoa (A–Z)"
                  />
                  <RuleItem ok={pwdRules.digit} text="Ít nhất 1 chữ số (0–9)" />
                  <RuleItem
                    ok={pwdRules.special}
                    text="Ít nhất 1 ký tự đặc biệt (!@#$…)"
                  />
                </ul>
              </div>
            )}
          </div>
          {errors.password && <p className="err-msg">{errors.password}</p>}

          {/* Nhập lại */}
          <label className="lbl">Nhập lại mật khẩu</label>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              className={`input ${errors.confirm ? "input-error" : ""}`}
              type={showConfirm ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              value={confirm}
              onChange={(e) => setConfirmWithLimit(e.target.value)}
              onKeyDown={(e) => blockWhenMax(e, confirm, "confirm")}
              onPaste={(e) => handlePasteLimit(e, confirm, "confirm")}
              required
              maxLength={MAX_PWD}
              style={{ paddingRight: 44 }}
              aria-invalid={confirm && confirm !== password ? true : undefined}
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowConfirm((s) => !s)}
              aria-label={
                showConfirm ? "Ẩn mật khẩu nhập lại" : "Hiện mật khẩu nhập lại"
              }
              title={
                showConfirm ? "Ẩn mật khẩu nhập lại" : "Hiện mật khẩu nhập lại"
              }
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                height: 32,
                width: 32,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
              }}
            >
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {/* Gợi ý khớp mật khẩu theo thời gian thực */}
          {confirm && confirm !== password && (
            <p className="err-msg" aria-live="polite">
              Mật khẩu nhập lại chưa khớp.
            </p>
          )}
          {errors.confirm && <p className="err-msg">{errors.confirm}</p>}

          {/* Điều khoản */}
          <div className="remember-forgot" style={{ marginTop: 8 }}>
            <label>
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              Tôi đồng ý <a href="#">Điều Khoản Dịch Vụ</a> và{" "}
              <a href="#">Thoả Thuận Riêng Tư</a>
            </label>
          </div>
          {errors.agree && <p className="err-msg">{errors.agree}</p>}

          {/* Submit */}
          <button className="primary-btn" type="submit" disabled={submitting}>
            {submitting ? "Đang tạo..." : "Tạo tài khoản"}
          </button>

          <div className="divider">
            <span>Hoặc</span>
          </div>

          {/* Google */}
          <button
            type="button"
            className="google-btn"
            onClick={handleGoogleSignup}
            disabled={submitting}
          >
            <img src={googleLogo} alt="Google" className="gicon-img" />
            Đăng ký bằng Google
          </button>

          <div className="register-link">
            Đã có tài khoản? <a href="/login">Đăng nhập</a>
          </div>
        </form>
      </section>
    </div>
  );
}
