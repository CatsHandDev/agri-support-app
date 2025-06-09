// frontend/src/app/producers/page.tsx
'use client';

import React, { useState, useEffect, ChangeEvent, useCallback, useRef } from 'react';
import { getProducers, ProfileApiFilters } from '@/services/profileApi'; // API関数
import { Profile } from '@/types/profile'; // 型定義
import {
  Container, Typography, Grid, Box, CircularProgress, Alert,
  Pagination, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel, Button, SelectChangeEvent, Paper,
  Tooltip,
  Stack
} from '@mui/material';
import { Search } from '@mui/icons-material';
import ClearIcon from '@mui/icons-material/Clear';
import ProducerCard from '@/components/producers/ProducerCard'; // 生産者カードを再利用
import { debounce } from 'es-toolkit';

const ITEMS_PER_PAGE = 12; // APIのページサイズに合わせる
// 都道府県リストなど (実際にはAPIや定数ファイルから取得)
const PREFECTURES = ["北海道", "青森県", "岩手県", /* ... */ "沖縄県"];

export default function ProducersPage() {
  const [producers, setProducers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducers, setTotalProducers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState<ProfileApiFilters>({
    search: '',
    location_prefecture: '',
    ordering: '-created_at', // デフォルトは新着順
  });

  const mediaBaseUrl = process.env.NEXT_PUBLIC_DJANGO_MEDIA_URL || 'http://localhost:8000';
  const totalPages = Math.ceil(totalProducers / ITEMS_PER_PAGE);

  // --- データ取得関数 ---
  const loadProducers = useCallback(async (page = 1, currentFilters: ProfileApiFilters) => {
    setIsLoading(true);
    setError(null);
    console.log('[loadProducers] Loading page:', page, 'Filters:', currentFilters);

    const apiParams: ProfileApiFilters = {
      ...currentFilters,
      page: page,
    };
    // 不要なパラメータ削除
    if (!apiParams.search) delete apiParams.search;
    if (!apiParams.location_prefecture) delete apiParams.location_prefecture;
    if (apiParams.ordering === '-created_at') delete apiParams.ordering;

    try {
      const response = await getProducers(apiParams);
      setProducers(response.results);
      setTotalProducers(response.count);
    } catch (err: any) {
      console.error("Failed to fetch producers", err);
      setError(err.message || "生産者情報の読み込みに失敗しました。");
      setProducers([]);
      setTotalProducers(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- 初回ロード & フィルター/ページ変更時のロード ---
  const debouncedLoadRef = useRef(
    debounce((page: number, currentFilters: ProfileApiFilters) => {
      loadProducers(page, currentFilters);
    }, 500)
  );
  const isInitialMount = useRef(true);

  useEffect(() => {
    const debouncedLoadRefResponse = debouncedLoadRef.current;

    if (isInitialMount.current) {
      loadProducers(currentPage, filters);
      isInitialMount.current = false;
    } else {
      // currentPage が変わったか、filters が変わった場合 (debounce)
      // filters が変わった時は currentPage を 1 にリセットする必要がある
      debouncedLoadRefResponse(currentPage, filters);
    }
    return () => debouncedLoadRefResponse.cancel();
  }, [currentPage, filters, loadProducers]); // currentPage と filters を監視

  // --- ハンドラ ---
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    window.scrollTo(0, 0);
  };

  const handleFilterChange = (
      name: keyof ProfileApiFilters,
      value: string | string[] | number | null
  ) => {
      // フィルター変更時は1ページ目に戻る
      if (currentPage !== 1) setCurrentPage(1);
      setFilters(prev => ({ ...prev, [name]: value ?? '' }));
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('search', event.target.value);
  };

  const handlePrefectureChange = (event: SelectChangeEvent<string>) => {
    handleFilterChange('location_prefecture', event.target.value);
  };

  const handleOrderingChange = (event: SelectChangeEvent<string>) => {
    handleFilterChange('ordering', event.target.value);
  };

  const resetFilters = () => {
    setFilters({ search: '', location_prefecture: '', ordering: '-created_at' });
    setCurrentPage(1);
  };

  const isFiltered = JSON.stringify(filters) !== JSON.stringify({ search: '', location_prefecture: '', ordering: '-created_at' });

  // --- レンダリング ---
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          生産者を探す
        </Typography>
        {isFiltered &&
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
          <Grid sx={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="キーワード (農園名, 名前, 地域など)" variant="outlined" size="small"
              name="search" defaultValue={filters.search} onChange={handleSearchChange}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            />
          </Grid>
          <Grid sx={{ xs: 6, sm: 4, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="prefecture-filter-label">都道府県</InputLabel>
              <Select
                labelId="prefecture-filter-label"
                name="location_prefecture"
                value={filters.location_prefecture}
                label="都道府県"
                onChange={handlePrefectureChange}
                MenuProps={{ disableScrollLock: true }}
                sx={{ minWidth: 120 }}
              >
                <MenuItem value=""><em>すべて</em></MenuItem>
                {PREFECTURES.map(pref => <MenuItem key={pref} value={pref}>{pref}</MenuItem>)}
                {/* TODO: APIから取得 */}
              </Select>
            </FormControl>
          </Grid>
          {/* TODO: 市区町村フィルター (都道府県選択後に動的に変更) */}
          <Grid sx={{ xs: 6, sm: 4, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="ordering-filter-label">並び順</InputLabel>
              <Select
                labelId="ordering-filter-label"
                name="ordering"
                value={filters.ordering}
                label="並び順"
                onChange={handleOrderingChange}
                MenuProps={{ disableScrollLock: true }}
              >
                <MenuItem value="-created_at">新着順</MenuItem>
                <MenuItem value="farm_name">名前順</MenuItem>
                {/* 他の並び順 */}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* --- 生産者グリッド --- */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>
      ) : !producers || producers.length === 0 ? (
        <Typography sx={{ textAlign: 'center', mt: 5 }}>該当する生産者が見つかりませんでした。</Typography>
      ) : (
        <Grid container spacing={3}>
          {producers.map((profile) => (
            <Grid key={profile.id} sx={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <ProducerCard profile={profile} mediaBaseUrl={mediaBaseUrl} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* --- ページネーション --- */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, mb: 4 }}>
          <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} color="primary" size="large" />
        </Box>
      )}
    </Container>
  );
}