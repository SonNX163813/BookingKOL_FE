import { useState } from "react";
import { LogoutOutlined, VerifiedUserOutlined } from "@mui/icons-material";
import { Menu, MenuItem, IconButton, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AdminHeader = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    localStorage.clear();
    navigate("/login");
    toast.success("Đăng xuất thành công.");
  };

  return (
    <header className="w-full bg-gray-900 text-white px-6 py-3 flex justify-between items-center shadow-md h-20">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold">
          <span>L</span>
        </div>
        <h1 className="text-xl font-semibold overflow-hidden whitespace-nowrap relative">
          <span className="animate-marquee inline-block">
            My Admin Dashboard
          </span>
        </h1>
      </div>

      <div>
        <IconButton
          onClick={handleClick}
          className="!text-white flex items-center space-x-2"
        >
          <VerifiedUserOutlined className="w-6 h-6" />
          <Typography className="font-medium">Admin Name</Typography>
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <MenuItem onClick={handleLogout}>
            <LogoutOutlined className="mr-2" /> Logout
          </MenuItem>
        </Menu>
      </div>

      <style>
        {`
                    .animate-marquee {
                        display: inline-block;
                        animation: marquee 10s linear infinite;
                    }
                    @keyframes marquee {
                        0% {
                            transform: translateX(0%);
                        }
                        100% {
                            transform: translateX(-100%);
                        }
                    }
                `}
      </style>
    </header>
  );
};

export default AdminHeader;
