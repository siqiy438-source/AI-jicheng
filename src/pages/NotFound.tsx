import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFBF8] px-4">
      <div className="text-center flex-1 flex items-center justify-center">
        <div>
          <div className="text-8xl font-bold text-amber-600/20 select-none mb-2">
            404
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            页面走丢了
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            你访问的页面不存在，可能已被移除或地址有误
          </p>
          <Link
            to="/"
            className="inline-flex items-center rounded-full bg-amber-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>

      <footer className="py-4 w-full text-center">
        <a
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-500 transition-colors"
        >
          黔ICP备2026001006号
        </a>
      </footer>
    </div>
  );
};

export default NotFound;
