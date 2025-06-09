// frontend/src/app/products/page.tsx
'use client';

import React, { useState, useEffect, ChangeEvent, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { getProducts, ProductApiFilters } from '@/services/productApi';
import { Product } from '@/types/product';
import { useAuth } from '@/hooks/useAuth';
import {
  Container, Typography, Grid, Paper, Box, CircularProgress, Alert,
  Pagination, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel, Button, SelectChangeEvent,
  Slider, Checkbox, FormGroup, FormControlLabel, Stack, Chip, Tooltip
} from '@mui/material';
import { Search, FilterList as FilterListIcon, Clear as ClearIcon } from '@mui/icons-material';
import ProductCard from '@/components/products/ProductCard';
import { debounce, DebouncedFunction } from 'es-toolkit';

// --- 定数 ---
const ITEMS_PER_PAGE = 12;
const CATEGORY_CHOICES = ["野菜", "果物", "お米・穀物", "加工品", "季節限定", "ギフト"]; // APIから取得するのが理想
const CULTIVATION_CHOICES_MAP: { [key: string]: string } = {
  'conventional': '慣行栽培', 'special': '特別栽培', 'organic': '有機栽培(認証なし)',
  'organic_jas': '有機栽培(JAS)', 'natural': '自然栽培'
};

const ORDERING_CHOICES = [
  { value: '-created_at', label: '新着順' },
  { value: 'price', label: '価格の安い順' },
  { value: '-price', label: '価格の高い順' },
  { value: 'name', label: '名前順' },
];

const initialFilters: ProductApiFilters = { // 初期フィルター状態
  search: '',
  category: '',
  cultivation_method: [],
  min_price: '',
  max_price: '',
  ordering: '-created_at',
};

// ★ initialFilters を関数に変更して、URLパラメータを考慮できるようにする
const getInitialFilters = (searchParams: URLSearchParams | null): ProductApiFilters => {
  const initialCategory = searchParams?.get('category') || ''; // URLからカテゴリ取得
  return {
    search: searchParams?.get('search') || '', // 他のパラメータも同様に取得可能
    category: initialCategory,
    cultivation_method: [],
    min_price: '',
    max_price: '',
    ordering: '-created_at',
  };
};

export default function ProductsPage() {
  const { isAuthenticated, isProducer } = useAuth(); // 任意で使用
  const [products, setProducts] = useState<Product[]>([]); // 表示する商品リスト
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0); // 総件数
  const [allFilteredProducts, setAllFilteredProducts] = useState<Product[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams()

  // --- ページネーション State ---
  const [currentPage, setCurrentPage] = useState(1);
  // ★ totalPages は totalProducts から計算
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  const [filters, setFilters] = useState<ProductApiFilters>(() => getInitialFilters(searchParams));

  // 価格帯スライダー用の一時的な state (debounce のため)
  const [priceRange, setPriceRange] = useState<number[]>([
    Number(searchParams?.get('min_price') || 0), // URLパラメータから初期化 (任意)
    Number(searchParams?.get('max_price') || 10000)
  ]);

  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000';

  // --- データ取得関数 ---
  const loadProducts = useCallback(async (page = 1, currentFilters: ProductApiFilters) => {
    setIsLoading(true);
    setError(null);

    const apiParams: ProductApiFilters = { ...currentFilters };

    // 不要なパラメータを削除
    if (apiParams.search === '' || apiParams.search === null || apiParams.search === undefined) delete apiParams.search;
    if (apiParams.category === '' || apiParams.category === null || apiParams.category === undefined) delete apiParams.category;
    if (apiParams.min_price === '' || apiParams.min_price === null || apiParams.min_price === undefined || Number(apiParams.min_price) <= 0) delete apiParams.min_price;
    if (apiParams.max_price === '' || apiParams.max_price === null || apiParams.max_price === undefined || Number(apiParams.max_price) >= 10000) delete apiParams.max_price;
    if (!apiParams.cultivation_method || apiParams.cultivation_method.length === 0) delete apiParams.cultivation_method;
    if (apiParams.ordering === '-created_at' || apiParams.ordering === '' || apiParams.ordering === null || apiParams.ordering === undefined) delete apiParams.ordering; // デフォルトなら送らない

    console.log('[loadProducts] Constructed API Params:', JSON.stringify(apiParams, null, 2)); // ★追加

    try {
      const fetchedProducts = await getProducts(apiParams); // Product[] が返る
      setAllFilteredProducts(fetchedProducts);
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const currentDisplayProducts = fetchedProducts.slice(startIndex, endIndex);
      setProducts(currentDisplayProducts);
      setTotalProducts(fetchedProducts.length); // フィルター後の総件数をセット

      console.log('[loadProducts] Success - Fetched:', fetchedProducts.length,
                  'Displaying:', currentDisplayProducts.length,
                  'TotalProducts State will be:', fetchedProducts.length);
    } catch (err: any) {
      console.error("Failed to fetch products in loadProducts (catch block):", err.message, err.response?.data); // ★エラー詳細
      setError(err.message || "商品の読み込みに失敗しました。");
      setAllFilteredProducts([]);
      setProducts([]);
      setTotalProducts(0);
    }
    finally {
      console.log('[loadProducts] Before setIsLoading(false) - totalProducts:', totalProducts, 'products.length:', products.length);
      console.log('--- [loadProducts] END ---');
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- 初回ロード & フィルター変更時のロード ---
  const isInitialMount = useRef(true);
  const debouncedLoadRef = useRef(
    debounce((page: number, currentFilters: ProductApiFilters) => {
      loadProducts(page, currentFilters);
    }, 500)
  );

  useEffect(() => {
    const debouncedFunction = debouncedLoadRef.current;
    console.log('[useEffect Main Triggered] InitialMount:', isInitialMount.current, 'currentPage:', currentPage, 'filters:', JSON.stringify(filters)); // ★追加

    if (isInitialMount.current) {
      console.log('[useEffect Main] Initial load. Page:', currentPage, 'Filters:', JSON.stringify(filters, null, 2));
      loadProducts(currentPage, filters);
      isInitialMount.current = false;
    } else {
      console.log('[useEffect Main] Page or Filters changed. Page:', currentPage, 'Filters:', JSON.stringify(filters, null, 2));
      debouncedLoadRef.current(currentPage, filters);
    }
    return () => {
      console.log('[Debounce Cleanup for Main useEffect] Cancelling pending call.');
      if (debouncedFunction && typeof debouncedFunction.cancel === 'function') {
        debouncedFunction.cancel();
      }
    };
  }, [currentPage, filters, loadProducts]);

  // --- ページ変更時の表示更新 (フロントエンドページネーション) ---
  useEffect(() => {
    // currentPage または allFilteredProducts が変更されたら表示用商品を更新
    if (!isInitialMount.current) { // 初回ロードは上記の useEffect で処理
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      setProducts(allFilteredProducts.slice(startIndex, endIndex));
      console.log("Page changed, slicing products for page:", currentPage);
    }
  }, [currentPage, allFilteredProducts]);

  // --- ハンドラ ---
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value); // ★ これで上の useEffect がトリガーされる
    window.scrollTo(0, 0);
  };

  // フィルターの値を更新する汎用ハンドラ
  const handleFilterChange = (
      name: keyof ProductApiFilters,
      value: string | string[] | number | null
  ) => {
    // ★★★ フィルターが変更されたら、必ずページを1に戻す ★★★
    setCurrentPage(1);
    setFilters(prev => ({ ...prev, [name]: value ?? '' }));
  };

  // 各フィルターUI用のハンドラは handleFilterChange を使うように統一
  const handleSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('search', event.target.value);
  };

  const handleCategoryChange = (event: SelectChangeEvent<string>) => {
    handleFilterChange('category', event.target.value);
  };

  const handleOrderingChange = (event: SelectChangeEvent<string>) => {
    handleFilterChange('ordering', event.target.value);
  };

  const handlePriceChangeCommit = (event: Event | React.SyntheticEvent<Element, Event>, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      // ★ ページを1に戻す
      setCurrentPage(1);
      setFilters(prev => ({
        ...prev,
        min_price: newValue[0] > 0 ? String(newValue[0]) : '',
        max_price: newValue[1] < 10000 ? String(newValue[1]) : '',
      }));
    }
  };

  const handlePriceRangeChange = (event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setPriceRange(newValue);
    }
  };

  const handleCultivationChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    // ★ ページを1に戻す
    setCurrentPage(1);
    setFilters(prev => {
      const currentMethods = Array.isArray(prev.cultivation_method) ? [...prev.cultivation_method] : [];
      let newMethods: string[];
      if (checked) {
        newMethods = [...currentMethods, value];
      } else {
        newMethods = currentMethods.filter(method => method !== value);
      }
      return { ...prev, cultivation_method: newMethods };
    });
  };

  const resetFilters = () => {
    const defaultFilters = getInitialFilters(null); // URLパラメータなしの初期状態
    setFilters(defaultFilters);
    setPriceRange([0, 10000]);
    setCurrentPage(1);
    router.push('/products'); // ★ URLからもクエリパラメータを消す
  };

  // フィルターが適用されているかどうかのフラグ
  const isFiltered = JSON.stringify(filters) !== JSON.stringify(getInitialFilters(searchParams)) || JSON.stringify(filters) !== JSON.stringify(getInitialFilters(null));

  // 動的なページタイトル
  const pageTitle = filters.category ? `${filters.category} の商品一覧` : "商品を探す";

  // --- レンダリング ---
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          {pageTitle} {/* ★ 動的なタイトル */}
        </Typography>
        {/* フィルターリセットボタン */}
        {isFiltered && // フィルター適用中のみ表示
          <Tooltip title="フィルターをリセット">
            <Button onClick={resetFilters} size="small" startIcon={<ClearIcon />} variant="outlined" color="secondary">
              リセット
            </Button>
          </Tooltip>
        }
      </Stack>

      {/* --- 検索・フィルタバー --- */}
      <Paper elevation={0} variant="outlined" sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
            <Grid sx={{ xs: 12, md: 12 }}>
              <TextField fullWidth label="キーワード検索" variant="outlined" size="small"
                name="search"
                defaultValue={filters.search}
                onChange={handleSearchInputChange}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
              />
            </Grid>
            <Grid sx={{ xs: 6, md: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="category-filter-label">カテゴリ</InputLabel>
                <Select labelId="category-filter-label"
                  name="category"
                  value={filters.category}
                  label="カテゴリ"
                  onChange={handleCategoryChange}
                  MenuProps={{ disableScrollLock: true }}
                  sx={{ width: '150px'}}
                >
                  <MenuItem value=""><em>すべて</em></MenuItem>
                  {CATEGORY_CHOICES.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid sx={{ xs: 12, md: 2 }}>
              <Typography gutterBottom variant="caption" component="div">価格帯</Typography>
              <Slider
                value={priceRange} // ★ 表示用の state を使用
                onChange={handlePriceRangeChange} // ★ 表示用ハンドラ
                onChangeCommitted={handlePriceChangeCommit} // ★ 値確定時のハンドラ
                valueLabelDisplay="auto"
                min={0} max={10000} step={500} // step を調整
                marks={[{value: 0, label: priceRange[0]}, {value: 10000, label: priceRange[1]}]}
                disableSwap
                sx={{ mx: 2, width: '100%', minWidth: '250px'}}
              />
            </Grid>
            <Grid sx={{ xs: 12, md: 2 }}>
              <Typography variant="caption" component="div">栽培方法</Typography>
                <FormGroup sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', mt: 0.5 }}>
                  {Object.entries(CULTIVATION_CHOICES_MAP).map(([key, label]) => (
                    <FormControlLabel
                    key={key}
                    control={
                      <Checkbox
                        size="small"
                        name="cultivation_method"
                        value={key}
                        checked={filters.cultivation_method?.includes(key) || false}
                        onChange={handleCultivationChange}
                      />
                    }
                    label={<Typography variant="caption">{label}</Typography>}
                    sx={{ mr: 1 }} // チェックボックス間のマージン
                    />
                  ))}
                </FormGroup>
            </Grid>
            {/* TODO: 並び替え Select */}
            <Grid sx={{ xs: 6, sm: 3, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="ordering-filter-label">並び順</InputLabel>
                <Select labelId="ordering-filter-label" name="ordering" value={filters.ordering} label="並び順"
                  onChange={handleOrderingChange}
                  MenuProps={{ disableScrollLock: true }}
                >
                  {ORDERING_CHOICES.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                </Select>
              </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* --- 商品グリッド --- */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      ) : error ? ( // ★ エラー表示を追加
        <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>
      ) : (
        <>
          {/* 検索結果件数表示 (任意) */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {totalProducts > 0
              ? `${totalProducts} 件の商品が見つかりました`
              : '該当する商品が見つかりませんでした。'}
            {isFiltered && " (フィルター適用中)"}
          </Typography>
          {products.length === 0 ? (
            <Typography sx={{ textAlign: 'center', mt: 5 }}>該当する商品が見つかりませんでした。</Typography>
          ) : (
            <Grid container spacing={3}>
              {products.map((product) => (
                <Grid key={product.id} sx={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <ProductCard product={product} mediaBaseUrl={mediaBaseUrl} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {/* --- ページネーション --- */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 4 }}>
          <Pagination
            count={totalPages} // ★ totalPages を使用
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}
    </Container>
  );
}