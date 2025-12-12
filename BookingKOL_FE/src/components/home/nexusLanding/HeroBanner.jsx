import React, { useMemo, useState } from "react";
import dashboardVideo from "../../../assets/123.mp4";
import dashboardPoster from "../../../assets/videoframe_228.png"; // optional
import logoACB from "../../../assets/hapas.png";
import logoVietjet from "../../../assets/logo/ah.png";
import logo247 from "../../../assets/logo/nerman.png";
import logoNippon from "../../../assets/logo/generas.png";
import logoWin from "../../../assets/logo/novaon.png";
import logoVTV from "../../../assets/logo/onoff.png";
import the from "../../../assets/logo/the.png";

export default function NexusLiveHero() {
  const [pauseMarquee, setPauseMarquee] = useState(false);

  const logos = useMemo(
    () => [
      { src: logoACB, alt: "ACB" },
      { src: logoVietjet, alt: "Vietjet Air" },
      { src: logo247, alt: "247Express" },
      { src: logoNippon, alt: "Nippon Express" },
      { src: logoWin, alt: "WinCommerce" },
      { src: logoVTV, alt: "VTVcab" },
      { src: the, alt: "the" },
    ],
    []
  );

  return (
    <div className="nl-wrap">
      <style>{css}</style>

      <div className="nl-container">
        <header className="nl-header">{/* navbar bạn đã có riêng */}</header>

        <main className="nl-hero">
          <section className="nl-left">
            <h1 className="nl-title">
              <span className="nl-titleRow">Nền tảng livestream</span>
              <span className="nl-titleRow">
                cormerce đầu tiên <span className="nl-titleVN">Việt Nam</span>
              </span>
            </h1>

            <p className="nl-desc">
              Kết hợp dữ liệu - công nghệ - vận hành thực chiến
              <br />
              để chuẩn hoá toàn bộ chuỗi giá trị Livestream &amp; KOC
            </p>

            <div className="nl-actions">
              <button className="nl-btn nl-btnPrimary" type="button">
                Kết nối ngay
              </button>
            </div>
          </section>

          <section className="nl-right">
            <div className="nl-videoWrap">
              <video
                className="nl-video"
                src={dashboardVideo}
                poster={dashboardPoster}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
              />
            </div>
          </section>
        </main>

        {/* ✅ LOGO MARQUEE (chỉ hiện khi có logos) */}
        {logos.length > 0 && (
          <div className="nl-marquee">
            <div className="nl-marqueeTop">
              <span className="nl-marqueeText">
                <b>Được tin cậy bởi các thương hiệu hàng đầu</b>
              </span>
            </div>

            <div className="nl-marqueeViewport">
              <div
                className={`nl-marqueeTrack ${pauseMarquee ? "isPaused" : ""}`}
              >
                {/* Group 1 */}
                <div className="nl-marqueeGroup">
                  {logos.map((it, idx) => (
                    <div
                      className="nl-marqueeItem"
                      key={`g1-${it.alt}-${idx}`}
                      onMouseEnter={() => setPauseMarquee(true)}
                      onMouseLeave={() => setPauseMarquee(false)}
                      onFocus={() => setPauseMarquee(true)}
                      onBlur={() => setPauseMarquee(false)}
                      tabIndex={0}
                      title={it.alt}
                    >
                      <img
                        className="nl-marqueeLogo"
                        src={it.src}
                        alt={it.alt}
                      />
                    </div>
                  ))}
                </div>

                {/* Group 2 (nhân đôi để chạy vô hạn) */}
                <div className="nl-marqueeGroup" aria-hidden="true">
                  {logos.map((it, idx) => (
                    <div className="nl-marqueeItem" key={`g2-${it.alt}-${idx}`}>
                      <img className="nl-marqueeLogo" src={it.src} alt="" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const css = `
/* ✅ KHÔNG dùng :root để khỏi ảnh hưởng toàn site */
.nl-wrap{
  --blue: 113, 201, 249;
  --pink: 255, 211, 244;
  

  /* ✅ GIÃN KHOẢNG CÁCH LOGO */
  --logoGap: 72px;
  --logoH: 56px;
  --marqueeSpeed: 23s;

  min-height: auto;

  /* ✅ QUAN TRỌNG: ăn nền HomePage */
  background: transparent;

  color: #0b2b5a;
}

/* giữ nguyên layout */
.nl-container{
  max-width: 1560px;
  margin: 0 auto;
  padding: 26px 22px 20px;
}

.nl-header{ text-align:center; padding:8px 0 10px; }

.nl-hero{
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 36px;
  align-items: center;
  padding-top: 22px;
}

.nl-title{
  margin: 0;
  font-family: Interdisplay, Inter, Arial, sans-serif;
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #0a3b8f;
}
.nl-titleRow{ display:block; white-space:nowrap; }

.nl-titleVN{
  font-family: Interdisplay, Inter, Arial, sans-serif;
  font-style: normal;
  font-weight: 700;
  background: linear-gradient(90deg, #4aa8ff, #7a63ff, #ff6fd6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display:inline-block;
  padding-bottom:2px;
}

.nl-desc{
  margin: 14px 0 18px;
  font-family: Interdisplay, Inter, Arial, sans-serif;
  font-size: 1.15rem;
  line-height: 1.55;
  font-weight: 700;
  color: #2a63b8;
  max-width: 620px;
}

.nl-actions{ display:flex; align-items:center; gap:22px; margin-top:12px; }

.nl-btn{
  border:none;
  cursor:pointer;
  padding:12px 20px;
  border-radius:999px;
  font-weight:700;
  font-size:16px;
  box-shadow:0 12px 24px rgba(15,55,120,.12);
  transition: transform .12s ease, box-shadow .12s ease;
  min-width:170px;
}
.nl-btn:hover{ transform:translateY(-1px); box-shadow:0 16px 30px rgba(15,55,120,.16); }
.nl-btnPrimary{
  color:#0a3b8f;
  background: linear-gradient(90deg, rgba(var(--blue), .85), rgba(var(--pink), .65));
}

.nl-right{ display:flex; justify-content:flex-end; }
.nl-videoWrap{
  width:100%;
  max-width: 620px;
  aspect-ratio: 526 / 345;
  border-radius:24px;
  overflow:hidden;
  background:#fff;
  box-shadow:0 18px 40px rgba(15,55,120,.12);
  transform: translateX(5px);
}
.nl-video{ width:100%; height:100%; object-fit:cover; display:block; transform:translateZ(0); }

/* =======================
   ✅ MARQUEE LOGO
======================= */
.nl-marquee{
  margin-top: 45px;
  padding-top: 30px;

  /* ✅ tạo “tấm nền” chặn màu nền page không lem vào logo */
  position: relative;
}



/* nội dung marquee nằm trên plate */
.nl-marqueeTop,
.nl-marqueeViewport{
  position: relative;
  z-index: 1;
}

.nl-marqueeTop{
  display:flex;
  align-items:center;
  justify-content:center;
  gap: 10px;
  margin-bottom: 30px;
  color: rgba(11, 43, 90, .75);
  font-family: Inter, Arial, sans-serif;
  font-size: 14px;
  margin-top: 45px;
}

.nl-marqueeViewport{
  position: relative;
  overflow:hidden;
  width: 100%;
  padding: 8px 0;
}

.nl-marqueeTrack{
  display:flex;
  width: max-content;
  animation: nl-marquee var(--marqueeSpeed) linear infinite;
}
.nl-marqueeTrack.isPaused{ animation-play-state: paused; }

.nl-marqueeGroup{
  display:flex;
  align-items:center;
  gap: var(--logoGap);
  padding-right: var(--logoGap);
}

.nl-marqueeItem{
  flex: 0 0 auto;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor: pointer;
  outline: none;
}

.nl-marqueeLogo{
  height: var(--logoH);
  width: auto;
  opacity: .85;
  filter: grayscale(1);
  transition: opacity .18s ease, filter .18s ease, transform .18s ease;
}
.nl-marqueeItem:hover .nl-marqueeLogo,
.nl-marqueeItem:focus .nl-marqueeLogo{
  opacity: 1;
  filter: none;
  transform: translateY(-1px);
}

@keyframes nl-marquee{
  from{ transform: translateX(0); }
  to{ transform: translateX(-50%); }
}

@media (max-width: 980px){
  .nl-hero{ grid-template-columns:1fr; gap:18px; }
  .nl-right{ justify-content:flex-start; }
  .nl-videoWrap{ max-width: 700px; transform:none; }
  .nl-titleRow{ white-space:normal; }
  .nl-wrap{ --logoGap: 36px; --logoH: 24px; }
}

@media (max-width: 520px){
  .nl-title{ font-size:2.1rem; }
  .nl-desc{ font-size:1.02rem; }
  .nl-actions{ flex-direction:column; align-items:flex-start; gap:12px; }
  .nl-btn{ min-width:160px; }
}
`;
