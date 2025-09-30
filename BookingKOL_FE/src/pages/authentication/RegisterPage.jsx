// src/pages/auth/RegisterPage.jsx
import { useState, useEffect } from "react";
import "./login.css"; // style chung (login + register)
import "./register.css"; // style riêng cho Register
import logo from "../../assets/logocty.png";
import googleLogo from "../../assets/google_logo.svg.png";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// import { API_BASE } from "../../utils/config";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fullName, setFullName] = useState("");
  const [agree, setAgree] = useState(true);

  const [errors, setErrors] = useState({});
  const [serverErr, setServerErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const auth = useAuth?.() || {};
  const { token, dispatch = () => {} } = auth;

  const navigate = useNavigate();
  const location = useLocation();
  const backTo = location.state?.from?.pathname || "/";

  // ✅ Nếu đã đăng nhập (có token), tự điều hướng khỏi trang register
  useEffect(() => {
    if (token) {
      navigate(backTo, { replace: true });
    }
  }, [token, backTo, navigate]);

  const validate = () => {
    const next = {};

    if (!fullName.trim()) next.fullName = "Vui lòng nhập họ tên";

    if (!email.trim()) next.email = "Vui lòng nhập email";
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = "Email không hợp lệ";

    // Mật khẩu mạnh: >=8 ký tự, có hoa, thường, số, ký tự đặc biệt
    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$/;
    if (!strong.test(password)) {
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

    // Nếu dùng utils/config: const url = `${API_BASE}/api/v1/register/brand`;
    const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
    const url = `${API_BASE}/api/v1/register/brand`;

    const payload = { email, password, fullName };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // credentials: "include",
        body: JSON.stringify(payload),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        const msgRaw =
          (data && (data.message || data.error || data.detail)) ||
          `Đăng ký thất bại (HTTP ${res.status})`;
        const msg = Array.isArray(msgRaw) ? msgRaw.join(", ") : String(msgRaw);

        const finalMsg = msg.includes("Full authentication is required")
          ? "Endpoint /api/v1/register/brand cần permitAll() trong Spring Security, hoặc kiểm tra cấu hình auth/token."
          : msg;

        setServerErr(finalMsg);

        const fieldErr =
          (data &&
            (data.errors || data.fieldErrors || data.validationErrors)) ||
          null;
        if (fieldErr && typeof fieldErr === "object") {
          setErrors((prev) => ({ ...prev, ...fieldErr }));
        }
        setSubmitting(false);
        return;
      }

      // 🎯 Thành công: đưa user sang trang xác minh email
      const search = new URLSearchParams({ email });
      navigate(`/verify-email?${search.toString()}`, { replace: true });

      // Nếu sau này BE trả token và bạn muốn auto-login luôn:
      // const token = data?.data?.accessToken || data?.accessToken;
      // if (token) {
      //   const user = { id: data?.data?.id ?? null, email, roles: data?.data?.roles ?? [] };
      //   dispatch({ type: "LOGIN_SUCCESS", payload: { user, token, roles: user.roles, remember: true } });
      //   navigate(backTo, { replace: true });
      // }
    } catch (err) {
      setServerErr("Không thể kết nối server. Kiểm tra API đang chạy & CORS.");
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    alert("UI-only: Gắn đăng ký với Google sau.");
  };

  return (
    <div className="login-wrap register-page">
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
          className="hero-wave"
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
                             0%{ d: path("M 0,600 L 0,0 C 66.97560975609755,96.7887323943662 133.9512195121951,193.5774647887324 208,204 C 282.0487804878049,214.4225352112676 363.1707317073171,138.4788732394366 424,109 C 484.8292682926829,79.52112676056339 525.3658536585365,96.50704225352112 582,114 C 638.6341463414635,131.49295774647888 711.3658536585366,149.49295774647885 795,145 C 878.6341463414634,140.50704225352115 973.1707317073171,113.52112676056342 1042,131 C 1110.8292682926829,148.47887323943658 1153.9512195121952,210.4225352112676 1216,196 C 1278.0487804878048,181.5774647887324 1359.0243902439024,90.7887323943662 1440,0 L 1440,600 L 0,600 Z");}
                             25%{ d: path("M 0,600 L 0,0 C 54.0226726210924,104.15527310202678 108.0453452421848,208.31054620405357 172,212 C 235.9546547578152,215.68945379594643 309.84129165235316,118.91308828581245 386,115 C 462.15870834764684,111.08691171418755 540.5894881484026,200.03710065269667 623,200 C 705.4105118515974,199.96289934730333 791.8007557540365,110.93850910340088 855,92 C 918.1992442459635,73.06149089659912 958.2074888354518,124.20886293369978 1028,135 C 1097.7925111645482,145.79113706630022 1197.3692889041565,116.22603916180006 1271,87 C 1344.6307110958435,57.77396083819993 1392.3153555479216,28.886980419099967 1440,0 L 1440,600 L 0,600 Z");}
                             50%{ d: path("M 0,600 L 0,0 C 78.82583304706287,42.93163861216077 157.65166609412574,85.86327722432154 222,115 C 286.34833390587426,144.13672277567846 336.21916867055995,159.4785297148746 391,182 C 445.78083132944005,204.5214702851254 505.47165922363456,234.22260391618 588,214 C 670.5283407763654,193.77739608382 775.8941944349023,123.63105462040535 848,100 C 920.1058055650977,76.36894537959465 958.9515630367571,99.25317760219858 1022,109 C 1085.048436963243,118.74682239780142 1172.2995534180695,115.35623497080041 1246,95 C 1319.7004465819305,74.64376502919959 1379.8502232909652,37.32188251459979 1440,0 L 1440,600 L 0,600 Z");}
                             75%{ d: path("M 0,600 L 0,0 C 53.92373754723462,82.33734111989007 107.84747509446925,164.67468223978014 181,188 C 254.15252490553075,211.32531776021986 346.5338371693576,175.63861216076947 416,142 C 485.4661628306424,108.36138783923053 532.0171762281002,76.77086911714188 589,99 C 645.9828237718998,121.22913088285812 713.3974579182412,197.27791137066302 798,216 C 882.6025420817588,234.72208862933698 984.3929920989349,196.11748540020614 1051,189 C 1117.6070079010651,181.88251459979386 1149.0305736860187,206.25214702851252 1208,180 C 1266.9694263139813,153.74785297148748 1353.4847131569907,76.87392648574374 1440,0 L 1440,600 L 0,600 Z");}
                             100%{ d: path("M 0,600 L 0,0 C 88.38131226382686,186.81277911370665 176.7626245276537,373.6255582274133 233,419 C 289.2373754723463,464.3744417725867 313.3308141532119,368.3105462040536 382,337 C 450.6691858467881,305.6894537959464 563.9141188594984,339.13225695637243 635,365 C 706.0858811405016,390.86774304362757 735.0127104087943,409.16042597045686 796,410 C 856.9872895912057,410.83957402954314 950.0350395053244,394.2260391618001 1022,397 C 1093.9649604946756,399.7739608381999 1144.8471315699073,421.93541738234285 1211,359 C 1277.1528684300927,296.06458261765715 1358.5764342150464,148.03229130882858 1440,0 L 1440,600 L 0,600 Z");}
                           }
               
                           .path-1{ animation: pathAnim-1 4s linear infinite; }
                           @keyframes pathAnim-1{
                             0%{ d: path("M 0,600 L 0,0 C 88.38131226382686,186.81277911370665 176.7626245276537,373.6255582274133 233,419 C 289.2373754723463,464.3744417725867 313.3308141532119,368.3105462040536 382,337 C 450.6691858467881,305.6894537959464 563.9141188594984,339.13225695637243 635,365 C 706.0858811405016,390.86774304362757 735.0127104087943,409.16042597045686 796,410 C 856.9872895912057,410.83957402954314 950.0350395053244,394.2260391618001 1022,397 C 1093.9649604946756,399.7739608381999 1144.8471315699073,421.93541738234285 1211,359 C 1277.1528684300927,296.06458261765715 1358.5764342150464,148.03229130882858 1440,0 L 1440,600 L 0,600 Z");}
                             25%{ d: path("M 0,600 L 0,0 C 51.53830298866367,102.21848162143593 103.07660597732735,204.43696324287185 182,281 C 260.92339402267265,357.56303675712815 367.23187907935426,408.4706286499485 433,422 C 498.76812092064574,435.5293713500515 523.9958777052559,411.6805221573342 588,403 C 652.0041222947441,394.3194778426658 754.7846100996223,400.8072827207145 835,367 C 915.2153899003777,333.1927172792855 972.8656818962556,259.0903469598076 1044,282 C 1115.1343181037444,304.9096530401924 1199.7526623153556,424.8313294400549 1268,394 C 1336.2473376846444,363.1686705599451 1388.1236688423223,181.58433527997255 1440,0 L 1440,600 L 0,600 Z");}
                             50%{ d: path("M 0,600 L 0,0 C 86.59086224665063,158.82377189969083 173.18172449330126,317.64754379938165 230,363 C 286.81827550669874,408.35245620061835 313.8639642734455,340.2335967021642 383,306 C 452.1360357265545,271.7664032978358 563.3624184129167,271.4180693919615 637,277 C 710.6375815870833,282.5819306080385 746.6863620748883,294.09412572998974 814,329 C 881.3136379251117,363.90587427001026 979.8921332875302,422.2054276880796 1049,422 C 1118.1078667124698,421.7945723119204 1157.7451047749914,363.08416351769154 1218,283 C 1278.2548952250086,202.91583648230846 1359.1274476125043,101.45791824115423 1440,0 L 1440,600 L 0,600 Z");}
                             75%{ d: path("M 0,600 L 0,0 C 86.84644452078325,130.71453108897285 173.6928890415665,261.4290621779457 242,317 C 310.3071109584335,372.5709378220543 360.0748883545172,352.9982823771899 423,341 C 485.9251116454828,329.0017176228101 562.0075575403642,324.57780831329444 625,315 C 687.9924424596358,305.42219168670556 737.894881484026,290.6904843696324 795,306 C 852.105118515974,321.3095156303676 916.4129165235315,366.6602542081759 995,403 C 1073.5870834764685,439.3397457918241 1166.4534524218482,466.66849879766403 1243,398 C 1319.5465475781518,329.33150120233597 1379.773273789076,164.66575060116799 1440,0 L 1440,600 L 0,600 Z");}
                             100%{ d: path("M 0,600 L 0,0 C 88.38131226382686,186.81277911370665 176.7626245276537,373.6255582274133 233,419 C 289.2373754723463,464.3744417725867 313.3308141532119,368.3105462040536 382,337 C 450.6691858467881,305.6894537959464 563.9141188594984,339.13225695637243 635,365 C 706.0858811405016,390.86774304362757 735.0127104087943,409.16042597045686 796,410 C 856.9872895912057,410.83957402954314 950.0350395053244,394.2260391618001 1022,397 C 1093.9649604946756,399.7739608381999 1144.8471315699073,421.93541738234285 1211,359 C 1277.1528684300927,296.06458261765715 1358.5764342150464,148.03229130882858 1440,0 L 1440,600 L 0,600 Z");}
                           }
                         `}</style>

          <defs>
            <linearGradient id="gradient" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="5%" stopColor="#116228"></stop>
              <stop offset="95%" stopColor="#7bdcb5"></stop>
            </linearGradient>
          </defs>

          <path
            className="path-0"
            d="M 0,600 L 0,0 C 66.97560975609755,96.7887323943662 133.9512195121951,193.5774647887324 208,204 C 282.0487804878049,214.4225352112676 363.1707317073171,138.4788732394366 424,109 C 484.8292682926829,79.52112676056339 525.3658536585365,96.50704225352112 582,114 C 638.6341463414635,131.49295774647888 711.3658536585366,149.49295774647885 795,145 C 878.6341463414634,140.50704225352115 973.1707317073171,113.52112676056342 1042,131 C 1110.8292682926829,148.47887323943658 1153.9512195121952,210.4225352112676 1216,196 C 1278.0487804878048,181.5774647887324 1359.0243902439024,90.7887323943662 1440,0 L 1440,600 L 0,600 Z"
            stroke="none"
            strokeWidth="0"
            fill="url(#gradient)"
            fillOpacity="0.53"
          />
          <path
            className="path-1"
            d="M 0,600 L 0,0 C 88.38131226382686,186.81277911370665 176.7626245276537,373.6255582274133 233,419 C 289.2373754723463,464.3744417725867 313.3308141532119,368.3105462040536 382,337 C 450.6691858467881,305.6894537959464 563.9141188594984,339.13225695637243 635,365 C 706.0858811405016,390.86774304362757 735.0127104087943,409.16042597045686 796,410 C 856.9872895912057,410.83957402954314 950.0350395053244,394.2260391618001 1022,397 C 1093.9649604946756,399.7739608381999 1144.8471315699073,421.93541738234285 1211,359 C 1277.1528684300927,296.06458261765715 1358.5764342150464,148.03229130882858 1440,0 L 1440,600 L 0,600 Z"
            stroke="none"
            strokeWidth="0"
            fill="url(#gradient)"
            fillOpacity="1"
          />
        </svg>
        {/* ... */}
      </section>

      {/* RIGHT */}
      <section className="right-card register">
        <div className="login-header">
          <img src={logo} alt="Logo" className="login-logo-top" />
          <h2 className="login-title">Đăng ký</h2>
          <p className="login-sub">Tạo tài khoản để bắt đầu khám phá.</p>
        </div>

        {errors.fullName && <p className="err-msg">{errors.fullName}</p>}
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
          <input
            className={`input ${errors.password ? "input-error" : ""}`}
            type="password"
            placeholder="Tạo mật khẩu mạnh"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {errors.password && <p className="err-msg">{errors.password}</p>}

          {/* Nhập lại */}
          <label className="lbl">Nhập lại mật khẩu</label>
          <input
            className={`input ${errors.confirm ? "input-error" : ""}`}
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {errors.confirm && <p className="err-msg">{errors.confirm}</p>}

          {/* Điều khoản */}
          <div className="remember-forgot">
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
