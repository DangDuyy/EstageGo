import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NavBar from '@/components/common/NavBar';
import { FooterBar } from '@/components/common/FooterBar';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { nlSearchPropertiesAPI } from '@/apis';

export default function AISearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Vui lòng nhập câu tìm kiếm');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const data = await nlSearchPropertiesAPI(query);
      setLoading(false);

      if (data.success) {
        // Chuyển hướng đến trang listing và truyền kết quả
        navigate('/listing/grid', { 
          state: { 
            properties: data.properties,
            query: query,
            filters: data.filtersUsed,
            isAISearch: true
          } 
        });
      } else {
        setError(data.message || "Tìm kiếm thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Lỗi khi gọi AI Search API:", err);
      setLoading(false);
      setError("Có lỗi kết nối đến server. Vui lòng thử lại sau.");
    }
  };

  const exampleQueries = [
    "3 phòng ngủ gần trường học, dưới 3 tỷ VND",
    "Căn hộ cao cấp khu vực quận 1",
    "Nhà mặt phố cho thuê có 4 phòng tắm",
    "Villa biệt thự từ 5 tỷ đến 10 tỷ",
    "Apartment for rent with 2 bedrooms under 20 million VND/month"
  ];

  const handleExampleClick = (example) => {
    setQuery(example);
    setError('');
  };

  return (
    <>
      <NavBar />
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Tìm kiếm Thông minh với AI</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Mô tả bất động sản bạn mong muốn bằng ngôn ngữ tự nhiên, AI sẽ giúp bạn tìm kiếm
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Nhập yêu cầu tìm kiếm</CardTitle>
            <CardDescription>
              Hãy mô tả bất động sản bạn đang tìm kiếm một cách tự nhiên, bao gồm số phòng, giá cả, vị trí...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input 
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setError('');
                    }}
                    placeholder='Ví dụ: "3 phòng ngủ gần trường học, dưới 3 tỷ VND"'
                    className="pl-10 py-6 text-base"
                    disabled={loading}
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={loading || !query.trim()}
                  className="px-8"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang phân tích...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Tìm kiếm AI
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}
            </form>

            <div className="mt-8">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                Ví dụ câu tìm kiếm:
              </h3>
              <div className="flex flex-wrap gap-2">
                {exampleQueries.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleExampleClick(example)}
                    disabled={loading}
                    className="text-sm"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 Chính xác</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI hiểu ngữ cảnh và tìm đúng những gì bạn cần
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⚡ Nhanh chóng</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Không cần điền nhiều form, chỉ cần nói ra mong muốn
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🌐 Đa ngôn ngữ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Hỗ trợ cả tiếng Việt và tiếng Anh một cách tự nhiên
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
      <FooterBar />
    </>
  );
}
