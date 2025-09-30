import { User } from "lucide-react"; // icon admin
const AdminHeader = () => {
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

      <div className="flex items-center space-x-2">
        <User className="w-6 h-6" />
        <span className="font-medium">Admin Name</span>
      </div>

      <style>
        {`
                    .animate-marquee {
                        display: inline-block;
                        animation: marquee 6s linear infinite;
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
