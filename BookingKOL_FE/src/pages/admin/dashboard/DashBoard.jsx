const DashBoard = () => {
  return (
    <div className="flex flex-col gap-15 flex-1 overflow-y-auto h-full pb-10">
      <div
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-8 px-5
            rounded-lg shadow-md flex flex-col items-center text-center"
      >
        <p className="text-[40px]">✨✨✨</p>
        <h2 className="text-lg font-bold">Chào mừng, Admin!</h2>
        <p className="text-sm">Chúc bạn một ngày làm việc hiệu quả 🌟</p>
      </div>
    </div>
  );
};
export default DashBoard;
