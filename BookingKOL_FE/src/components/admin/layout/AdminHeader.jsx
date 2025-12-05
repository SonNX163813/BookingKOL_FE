import { useState } from "react";
import { LogoutOutlined, VerifiedUserOutlined } from "@mui/icons-material";
import { Menu, MenuItem, IconButton, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import NotificationBell from "../../common/NotificationBell";

const AdminHeader = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const { logout, user } = useAuth(); // lấy từ AuthContext

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleClose();
    await logout(); // không truyền tham số
    toast.success("Đăng xuất thành công.");
    navigate("/login", { replace: true }); // chặn Back quay lại trang cũ
    // Nếu vẫn còn cache từ Redux/React Query thì thêm:
    // window.location.reload();
  };

  return (
    <header className="w-full bg-gray-900 text-white px-6 py-3 flex justify-between items-center shadow-md h-20">
      <div className="flex items-center space-x-3">
        <h1 className="text-xl font-semibold overflow-hidden whitespace-nowrap relative">
          <span className="animate-marquee inline-block">Admin Dashboard</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <NotificationBell
          loggedIn={Boolean(user)}
          iconButtonSx={{
            color: "#fff",
            "&:hover": { backgroundColor: "rgba(255,255,255,0.08)" },
          }}
          badgeProps={{
            sx: {
              "& .MuiBadge-badge": {
                color: "#fff",
              },
            },
          }}
          menuPaperSx={{ mt: 1.5 }}
        />

        <div>
          <IconButton
            onClick={handleClick}
            className="!text-white flex items-center space-x-2"
          >
            <VerifiedUserOutlined className="w-6 h-6" />
            <Typography className="font-medium">
              {user?.fullName || user?.username || "Tài khoản"}
            </Typography>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem onClick={handleLogout}>
              <LogoutOutlined className="mr-2" /> Đăng xuất
            </MenuItem>
          </Menu>
        </div>
      </div>

      <style>
        {`
          .animate-marquee { display: inline-block; animation: marquee 10s linear infinite; }
          @keyframes marquee { 0% { transform: translateX(0%);} 100% { transform: translateX(-100%);} }
        `}
      </style>
    </header>
  );
};

export default AdminHeader;
