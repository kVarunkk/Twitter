import ScrollToTop from "@/components/ScrollToTop";
import SearchArea from "@/components/SearchArea";
import Sidebar from "@/components/Sidebar";

export default function Search() {
  return (
    <div className="App">
      <Sidebar />
      <SearchArea />
      <ScrollToTop />
    </div>
  );
}
