// frontend/src/components/layout/Header.tsx
'use client';

import React, { useState, KeyboardEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth'; // 認証状態取得
import Image from 'next/image';
import {
  AppBar, Toolbar, Box, Typography, TextField, InputAdornment, Button,
  IconButton, Badge, Drawer, List, ListItem, ListItemButton, ListItemText, Divider,
  useMediaQuery, useTheme, Menu, MenuItem, // ★ Menu, MenuItem を追加
  Paper
} from '@mui/material';
import { Search, ShoppingCart, Person as AccountIcon, Menu as MenuIcon, Logout as LogoutIcon, Favorite, FavoriteBorder as FavoriteIcon } from '@mui/icons-material'; // ★ AccountIcon, LogoutIcon をインポート
import { useRouter } from 'next/navigation'; // リダイレクト用
import { useCart } from '@/hooks/useCart';

export default function Header() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isAuthenticated, logout, isProducer } = useAuth(); // ★ 認証情報とログアウト関数を取得
  const router = useRouter();
  const { totalItems } = useCart();

  // --- アカウントメニュー用の State とハンドラ ---
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // メニューのアンカー要素
  const openAccountMenu = Boolean(anchorEl);

  // ヘッダー検索用の State とハンドラ
  const [searchTerm, setSearchTerm] = useState('');

  const handleAccountMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isAuthenticated) {
      // ログイン済みならメニューを開く
      setAnchorEl(event.currentTarget);
    } else {
      // 未ログインならログインページへ
      router.push('/login');
    }
  };

  const handleAccountMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleAccountMenuClose(); // メニューを閉じる
    logout(); // useAuth のログアウト関数を呼び出す (中で /login へリダイレクトされる)
  };
  // --- ここまで ---

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (event.type === 'keydown' && ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  // --- ドロワーの中身 (モバイル用) ---
  const drawerList = (
    <Box sx={{ width: 280, pt: 2, pb: 2 }} role='presentation' onClick={toggleDrawer(false)} onKeyDown={toggleDrawer(false)}>
      <Box sx={{ px: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
        <Image src='/harvest_logo3.png' alt='ロゴ' width={250} height={50} />
      </Box>
      <Divider />
      <List>
        {/* モバイル用メニュー項目 */}
        <ListItem disablePadding>
          <ListItemButton component={Link} href='/products'><ListItemText primary='商品一覧' /></ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton component={Link} href='/producers'><ListItemText primary='生産者一覧' /></ListItemButton>
        </ListItem>
        {isAuthenticated && isProducer && ( // 生産者のみ
          <ListItem disablePadding>
            <ListItemButton component={Link} href='/my-products'><ListItemText primary='商品管理' /></ListItemButton>
          </ListItem>
        )}
         {isAuthenticated && isProducer && ( // 生産者のみ
          <ListItem disablePadding>
            <ListItemButton component={Link} href='/products/new'><ListItemText primary='商品登録' /></ListItemButton>
          </ListItem>
        )}
        <Divider sx={{ my: 1 }} />
        {/* 認証状態に応じたメニュー */}
        {isAuthenticated ? (
          <>
            <ListItem disablePadding>
              <ListItemButton component={Link} href='/account'> {/* ★ マイページへのパス */}
                <ListItemText primary='マイページ' />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} href='/favorites'>
                <ListItemText primary='お気に入り' />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout}> {/* ★ モバイル用ログアウト */}
                <LogoutIcon sx={{ mr: 1, color: 'error.main' }} />
                <ListItemText primary='ログアウト' sx={{ color: 'error.main' }} />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <ListItem disablePadding>
            <ListItemButton component={Link} href='/login'>
              <ListItemText primary='ログイン / 新規登録' />
            </ListItemButton>
          </ListItem>
        )}
      </List>
    </Box>
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = () => {
    if (searchTerm.trim()) {
      console.log(`[Header] Submitting search for: ${searchTerm}`);
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm(''); // 検索後に入力欄をクリア (任意)
    }
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  return (
    <>
      <AppBar position='sticky' color='default' elevation={1} sx={{ bgcolor: '#F7F3E8' }}>
        <Toolbar>
          {/* ロゴ */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Link href='/' style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <Image src='/harvest_logo3.png' alt='ロゴ' width={250} height={50} />
              {!isMobile && (
                <Typography variant='h6' color='primary.dark' sx={{ ml: 1, fontWeight: 'bold' }} />
              )}
            </Link>
          </Box>

          {/* 検索バー (デスクトップ) */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, alignItems: 'center', mx: 4, my: 1, maxWidth: 600 }}>
              <TextField
                fullWidth
                placeholder='商品名、生産者名で検索'
                variant='outlined'
                size='small'
                value={searchTerm} // ★ state をバインド
                onChange={handleSearchChange} // ★ state 更新ハンドラ
                onKeyDown={handleSearchKeyDown} // ★ Enterキー処理
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position='end'>
                      <Button
                        variant='contained'
                        color='primary' // テーマの primary.dark (#16a34a) になる
                        onClick={handleSearchSubmit} // ★ 検索実行ハンドラ
                        size='small' // TextField のサイズに合わせる
                        sx={{ mr: -1 }} // TextField の枠線との調整
                      >
                        検索
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          )}

          {/* 右側のアイコン群 */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            {/* デスクトップ用ショートカット (お気に入りはログイン時のみ) */}
            {!isMobile && isAuthenticated && (
              <>
                <IconButton sx={{ mr: 0, color: 'text.secondary' }} component={Link} href='/favorites'>
                  <Favorite />
                </IconButton>
              </>
            )}
             {/* カートアイコン */}
            <IconButton sx={{color: '#16a34a'}} component={Link} href='/cart'> {/* アカウントアイコンとの間隔調整 */}
              <Badge badgeContent={totalItems} color='primary'>
                <ShoppingCart />
              </Badge>
            </IconButton>
            {/* アカウントアイコン (メニューボタン) */}
            {!isMobile && (
              <>
                <IconButton
                  sx={{color: '#16a34a'}}
                  id='account-button'
                  aria-controls={openAccountMenu ? 'account-menu' : undefined}
                  aria-haspopup='true'
                  aria-expanded={openAccountMenu ? 'true' : undefined}
                  onClick={handleAccountMenuClick} // ★ ハンドラを設定
                >
                  <AccountIcon />
                </IconButton>
                {/* アカウントメニュー */}
                <Menu
                  id='account-menu'
                  anchorEl={anchorEl}
                  open={openAccountMenu}
                  disableScrollLock={true}
                  onClose={handleAccountMenuClose}
                  MenuListProps={{ 'aria-labelledby': 'account-button' }}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  {isAuthenticated ? (
                    // ★ ログイン済みメニュー
                    [ // 配列にして key を付与
                      <MenuItem key='mypage' onClick={handleAccountMenuClose} component={Link} href='/account'> {/* ★ マイページへのパス */}
                        マイページ
                      </MenuItem>,
                      // 生産者のみ表示するリンクを追加
                      isProducer && (
                        <MenuItem key="received-orders" onClick={handleAccountMenuClose} component={Link} href="/orders-received"> {/* ★ リンク先 */}
                          受注管理
                        </MenuItem>
                      ),
                      isProducer && (
                        <MenuItem key='myproducts' onClick={handleAccountMenuClose} component={Link} href='/my-products'>
                          商品管理
                        </MenuItem>
                      ),
                      isProducer && (
                        <MenuItem key='newproduct' onClick={handleAccountMenuClose} component={Link} href='/my-products/new'>
                          商品登録
                        </MenuItem>
                      ),
                      <MenuItem key='farm-settings' onClick={handleAccountMenuClose} component={Link} href='/farm-settings'>
                        プロフィール編集
                      </MenuItem>,
                      <Divider key='divider' />,
                      <MenuItem key='logout' onClick={handleLogout} sx={{ color: 'error.main' }}> {/* ★ ログアウト処理 */}
                        <LogoutIcon fontSize='small' sx={{ mr: 1 }} />
                        ログアウト
                      </MenuItem>
                    ]
                  ) : (
                    // ★ 未ログイン時の表示 (メニューは通常表示しないが、念のため)
                    <MenuItem onClick={handleAccountMenuClose} component={Link} href='/login'>
                      ログイン
                    </MenuItem>
                  )}
                </Menu>
              </>
            )}
            {/* モバイル用メニューボタン */}
            {isMobile && (
              <IconButton edge='start' color='inherit' aria-label='menu' sx={{ pr: 0 }} onClick={toggleDrawer(true)}>
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
        {/* モバイル用検索バー */}
        {isMobile && (
          <Box sx={{ px: 2, pb: 1 }}>
            <TextField fullWidth placeholder='検索' variant='outlined' size='small' InputProps={{ startAdornment: (<InputAdornment position='start'><Search /></InputAdornment>),}} />
          </Box>
        )}
      </AppBar>
      {/* モバイル用ドロワー */}
      <Drawer anchor='left' open={drawerOpen} onClose={toggleDrawer(false)}>
        {drawerList}
      </Drawer>
    </>
  );
}