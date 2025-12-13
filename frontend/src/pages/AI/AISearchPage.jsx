import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NavBar from '@/components/common/NavBar';
import { FooterBar } from '@/components/common/FooterBar';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { nlSearchPropertiesAPI, searchPropertiesByTagAPI } from '@/apis';

export default function AISearchPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if there's a tag search from ImageTaggingPage
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tag = searchParams.get('tag');
    if (tag) {
      handleTagSearch(tag);
    }
  }, [location.search]);
  
  const handleTagSearch = async (tagLabel) => {
    if (!tagLabel.trim()) return;
    
    setQuery(tagLabel);
    setError('');
    setSuggestions(null);
    setLoading(true);
    
    try {
      const data = await searchPropertiesByTagAPI(tagLabel, 1, 50);
      setLoading(false);
      
      if (data.success && data.data?.properties) {
        navigate('/listing/grid', {
          state: {
            properties: data.data.properties,
            query: tagLabel,
            filters: { tag: tagLabel },
            isAISearch: true,
            isTagSearch: true
          }
        });
      } else {
        setError(`Không tìm thấy bất động sản với tag "${tagLabel}"`);
      }
    } catch (err) {
      console.error("Lỗi khi tìm kiếm theo tag:", err);
      setLoading(false);
      setError("Có lỗi kết nối đến server. Vui lòng thử lại sau.");
    }
  };

  const handleSearch = async (e, searchQuery = null) => {
    e?.preventDefault();
    const queryToSearch = searchQuery || query;
    
    if (!queryToSearch.trim()) {
      setError('Vui lòng nhập câu tìm kiếm');
      return;
    }
    
    setError('');
    setSuggestions(null);
    setLoading(true);

    try {
      const data = await nlSearchPropertiesAPI(queryToSearch);
      setLoading(false);

      console.log("AI Search Response:", data);
      console.log("Total Properties:", data.totalProperties);
      console.log("Properties length:", data.properties?.length);

      if (data.success) {
        // Nếu có kết quả, chuyển đến listing
        if (data.totalProperties > 0 && data.properties && data.properties.length > 0) {
          navigate('/listing/grid', { 
            state: { 
              properties: data.properties,
              query: queryToSearch,
              filters: data.filtersUsed,
              isAISearch: true
            } 
          });
        } else {
          // Không có kết quả, hiển thị suggestions nếu có
          const hasSuggestions = data.searchSuggestions && (
            data.searchSuggestions.didYouMean ||
            (data.searchSuggestions.suggestions && data.searchSuggestions.suggestions.length > 0) ||
            (data.searchSuggestions.keywordCorrections && data.searchSuggestions.keywordCorrections.length > 0)
          );
          
          if (hasSuggestions) {
            setSuggestions(data.searchSuggestions);
            setError(""); // Clear error nếu có suggestions
          } else {
            setError("Không tìm thấy bất động sản phù hợp với yêu cầu của bạn. Vui lòng thử lại với từ khóa khác hoặc điều chỉnh tiêu chí tìm kiếm.");
          }
        }
      } else {
        setError(data.message || "Tìm kiếm thất bại. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Lỗi khi gọi AI Search API:", err);
      setLoading(false);
      setError("Có lỗi kết nối đến server. Vui lòng thử lại sau.");
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setSuggestions(null);
    handleSearch(null, suggestion);
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
                <div className="mt-4 p-4 rounded-md bg-orange-50 border border-orange-200">
                  <p className="text-sm text-orange-800 font-medium mb-3">
                    {error}
                  </p>
                  <div className="text-sm text-orange-700">
                    <p className="font-semibold mb-2">💡 Gợi ý để tìm kiếm tốt hơn:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Thử mô tả chi tiết hơn về vị trí (quận, phường, đường)</li>
                      <li>Thêm thông tin về giá, diện tích, số phòng</li>
                      <li>Sử dụng các từ khóa như "cho thuê", "mua bán", "căn hộ", "nhà phố"</li>
                    </ul>
                  </div>
                  {exampleQueries.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-orange-700 mb-2">Hoặc thử các ví dụ:</p>
                      <div className="flex flex-wrap gap-2">
                        {exampleQueries.slice(0, 3).map((example, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setQuery(example);
                              setError('');
                            }}
                            className="text-xs border-orange-300 text-orange-700 hover:bg-orange-100"
                          >
                            {example}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {suggestions && (suggestions.didYouMean || (suggestions.suggestions && suggestions.suggestions.length > 0) || (suggestions.keywordCorrections && suggestions.keywordCorrections.length > 0)) && (
                <div className="mt-4 p-4 rounded-md bg-blue-50 border border-blue-200">
                  {suggestions.didYouMean && (
                    <div className="mb-3">
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>Ý bạn là:</strong>{' '}
                        <button
                          onClick={() => handleSuggestionClick(suggestions.didYouMean)}
                          className="text-blue-600 hover:text-blue-800 underline font-medium"
                        >
                          {suggestions.didYouMean}
                        </button>
                        ?
                      </p>
                    </div>
                  )}

                  {suggestions.keywordCorrections && suggestions.keywordCorrections.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>Bạn có thể muốn tìm:</strong>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.keywordCorrections.map((correction, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="line-through text-gray-500">{correction.original}</span>
                            {' → '}
                            <button
                              onClick={() => handleSuggestionClick(correction.suggestion)}
                              className="text-blue-600 hover:text-blue-800 underline font-medium"
                            >
                              {correction.suggestion}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.suggestions && suggestions.suggestions.length > 0 && (
                    <div>
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>Gợi ý khác:</strong>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.suggestions.slice(0, 5).map((suggestion, idx) => (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
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
