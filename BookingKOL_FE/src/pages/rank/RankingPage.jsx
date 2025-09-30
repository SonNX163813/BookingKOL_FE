import React, { useState } from "react";
import {
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
} from "@mui/material";
import {
  Search,
  CalendarToday,
  Category,
  Sort,
  GridView,
  ViewList,
} from "@mui/icons-material";
import { LayoutGrid, Trophy } from "lucide-react";
import { motion } from "framer-motion";
const top3 = [
  {
    id: 2,
    name: "Linh Chi",
    role: "Beauty Influencer",
    followers: "2.1M",
    engagement: "12.3%",
    growth: "+22%",
    medal: "🥈",
    bg: "bg-gradient-to-b from-gray-100 to-gray-200",
  },
  {
    id: 1,
    name: "Minh Tú",
    role: "Fashion KOL",
    followers: "3.5M",
    engagement: "15.2%",
    growth: "+30%",
    medal: "🥇",
    bg: "bg-gradient-to-b from-yellow-300 to-yellow-500",
  },
  {
    id: 3,
    name: "Mai Anh",
    role: "Lifestyle Blogger",
    followers: "1.8M",
    engagement: "9.7%",
    growth: "+8%",
    medal: "🥉",
    bg: "bg-gradient-to-b from-orange-300 to-orange-500",
  },
];

const RankingList = ({ data }) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-xl">
    <h3 className="text-xl font-bold mb-4">📊 Bảng Xếp Hạng Chi Tiết</h3>
    {data.map((kol, i) => (
      <motion.div
        key={i}
        className="flex items-center justify-between bg-white/10 rounded-xl p-4 mb-3 hover:bg-white/20 transition cursor-pointer"
        initial={{ x: -40, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1 }}
      >
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold w-6">#{kol.rank}</span>
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-xl">
            👤
          </div>
          <div>
            <p className="font-semibold">{kol.name}</p>
            <p className="text-sm opacity-70">{kol.category}</p>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="text-center">
            <p className="font-bold">{kol.followers}</p>
            <p className="text-xs opacity-70">Followers</p>
          </div>
          <div className="text-center text-green-400">
            <p>{kol.engagement}</p>
            <p className="text-xs opacity-70">Engagement</p>
          </div>
          <div className="text-center text-green-500">
            <p>{kol.growth}</p>
            <p className="text-xs opacity-70">Tăng trưởng</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg">
            Chi tiết
          </button>
          <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg">
            Hợp tác
          </button>
        </div>
      </motion.div>
    ))}
  </div>
);

const RankingGrid = ({ data }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
    {data.map((kol, i) => (
      <motion.div
        key={i}
        className="bg-white/10 rounded-2xl p-6 shadow-lg text-center hover:scale-105 transition-transform"
        initial={{ y: 40, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1 }}
      >
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center text-3xl">
          👤
        </div>
        <h4 className="mt-4 font-bold">{kol.name}</h4>
        <p className="text-sm opacity-70">{kol.category}</p>
        <div className="mt-4">
          <p className="text-lg font-bold">{kol.followers}</p>
          <p className="text-xs opacity-70">Followers</p>
        </div>
        <div className="flex justify-between mt-4 text-sm">
          <span className="text-green-400">{kol.engagement}</span>
          <span className="text-green-500">{kol.growth}</span>
        </div>
      </motion.div>
    ))}
  </div>
);

const data = [
  {
    rank: 1,
    name: "Quang Vinh",
    category: "Công Nghệ",
    followers: "5.2M",
    engagement: "8.5%",
    growth: "+15%",
  },
  {
    rank: 2,
    name: "Linh Chi",
    category: "Làm Đẹp",
    followers: "2.1M",
    engagement: "12.3%",
    growth: "+22%",
  },
  {
    rank: 3,
    name: "Mai Anh",
    category: "Lifestyle",
    followers: "1.8M",
    engagement: "9.7%",
    growth: "+8%",
  },
  {
    rank: 4,
    name: "Đức Phúc",
    category: "Công Nghệ",
    followers: "1.5M",
    engagement: "7.2%",
    growth: "+12%",
  },
  {
    rank: 5,
    name: "Thúy Kiều",
    category: "Làm Đẹp",
    followers: "1.3M",
    engagement: "11.8%",
    growth: "+18%",
  },
];

const RankingPage = () => {
  const [month, setMonth] = useState("all");
  const [year, setYear] = useState("2024");
  const [sort, setSort] = useState("rank");
  const [view, setView] = useState("list");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800 text-white px-6 py-10">
      <div className="max-w-[1500px] mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold flex items-center justify-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-400" strokeWidth={2.5} /> KOL
            Ranking Pro
          </h1>
          <p className="text-lg opacity-80 mt-2">
            Nền tảng xếp hạng influencer hàng đầu Việt Nam
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { value: "1,247", label: "KOLs Đã Xếp Hạng" },
            { value: "89.2M", label: "Tổng Followers" },
            { value: "12.5%", label: "Engagement TB" },
            { value: "24/7", label: "Cập Nhật Liên Tục" },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-md rounded-xl py-6 text-center shadow-lg"
            >
              <h2 className="text-2xl font-bold">{stat.value}</h2>
              <p className="opacity-80 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-12 shadow-2xl">
          <h3 className="text-xl font-semibold mb-4"> Bộ Lọc Thông Minh</h3>

          <div className="relative mb-6">
            <Search className="absolute top-3 left-3 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm KOL theo tên..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/20 border border-white/30 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="mb-2 font-medium flex items-center gap-2">
                <CalendarToday className="!w-5 !h-5 text-white" /> Thời gian
              </p>
              <FormControl
                fullWidth
                sx={{ background: "white", borderRadius: "8px" }}
              >
                <Select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                >
                  <MenuItem value="all">Tất cả</MenuItem>
                  {[...Array(12)].map((_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      Tháng {i + 1}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl
                fullWidth
                sx={{ background: "white", borderRadius: "8px", mt: 2 }}
              >
                <Select value={year} onChange={(e) => setYear(e.target.value)}>
                  {["2023", "2024", "2025"].map((y) => (
                    <MenuItem key={y} value={y}>
                      {y}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div>
              <p className="mb-2 font-medium flex items-center gap-2">
                <Category className="!w-5 !h-5 text-white" /> Danh mục
              </p>
              <div className="flex flex-wrap gap-2">
                {["Tất cả", "Làm đẹp", "Lifestyle", "Công nghệ"].map(
                  (cat, i) => (
                    <button
                      key={i}
                      className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 font-medium flex items-center gap-2">
                <Sort className="!w-5 !h-5 text-white" /> Sắp xếp theo
              </p>
              <FormControl
                fullWidth
                sx={{ background: "white", borderRadius: "8px" }}
              >
                <Select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <MenuItem value="rank">Thứ hạng</MenuItem>
                  <MenuItem value="followers">Followers</MenuItem>
                  <MenuItem value="engagement">Engagement</MenuItem>
                </Select>
              </FormControl>
            </div>

            <div>
              <p className="mb-2 font-medium flex items-center gap-2">
                <LayoutGrid className="!w-5 !h-5 text-white" /> Hiển thị
              </p>
              <div className="flex gap-3">
                <IconButton
                  onClick={() => setView("grid")}
                  sx={{
                    background:
                      view === "grid"
                        ? "linear-gradient(to right,#6a11cb,#2575fc)"
                        : "white",
                  }}
                >
                  <GridView />
                </IconButton>
                <IconButton
                  onClick={() => setView("list")}
                  sx={{
                    background:
                      view === "list"
                        ? "linear-gradient(to right,#6a11cb,#2575fc)"
                        : "white",
                  }}
                >
                  <ViewList />
                </IconButton>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <h3 className="text-xl font-bold">
            ⭐ Hall of Fame - Top 3 Xuất Sắc
          </h3>
          <div className="mt-10 flex justify-center gap-6 items-end">
            {top3.map((kol, index) => (
              <motion.div
                key={kol.id}
                className={`relative w-64 rounded-2xl shadow-xl p-6 text-center ${kol.bg}`}
                initial={{ y: 100, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                whileHover={{ scale: 1.05 }}
              >
                <div
                  className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-white shadow-md px-3 py-1 
                                                rounded-full font-bold text-sm text-blue-700"
                >
                  {kol.medal} #{kol.id}
                </div>

                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center text-3xl shadow-md">
                  👤
                </div>

                <h4 className="mt-4 font-bold text-lg">{kol.name}</h4>
                <p className="text-sm opacity-80">{kol.role}</p>

                <div className="bg-white text-black font-bold text-xl py-3 rounded-lg mt-4 shadow-inner">
                  {kol.followers}{" "}
                  <span className="text-sm font-normal">Followers</span>
                </div>

                <div className="flex justify-between text-sm mt-3 opacity-90">
                  <span className="text-green-600">{kol.growth}</span>
                  <span>{kol.engagement} engagement</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {view === "list" ? (
          <RankingList data={data} />
        ) : (
          <RankingGrid data={data} />
        )}
      </div>
    </div>
  );
};

export default RankingPage;
