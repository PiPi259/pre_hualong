/* ============================================================
   data.js — 遊戲內容都在這裡。調位置、改文字、加道具只要改這個檔。
   座標單位是 px，畫布大小 1680×936。
   ============================================================ */
const IMG = 'images/';

const GAME = {
  start: 'north',                 // 起始場景
  ring: ['north', 'east', 'south', 'west'], // 左右箭頭切換的順序
  slots: 10,                      // 道具欄格數
  password: '1948',
  safePlaceholder: '',            // 保險箱輸入框的提示文字（目前留空）
  startItems: ['rulebook'],       // 一開始就在道具欄的道具

  // 開場 / 結尾畫面：目前沒有內容，填了才會出現。
  // 格式：{ img:'xxx.png', text:'文字', button:'開始' }
  intro: null,
  ending: null,
  endingFallback: '任務達成',      // 沒有 ending 時，通關顯示的字幕

  msg: {
    full: '背包已滿！',
    wrong: '錯誤！請重新確認。',
    oneFruit: '一次只能放一顆，這些水果太大顆了',
  },

  // flip: [正面, 背面]，有此欄位的道具可以翻面
  items: {
    rulebook:    { name: '好像是進來前被塞的守則', img: 'item_s_rulebook.png' },
    apple:       { name: '不是bad apple', img: 'item_c_apple.png', fruit: true },
    strawberry:  { name: '這草莓怎麼這麼大顆', img: 'item_c_strawberry.png', fruit: true },
    lemon:       { name: '那一天的憂鬱，憂鬱起來', img: 'item_c_lemon.png', fruit: true, inBasket: 'an_c_glowing.png' },
    peach:       { name: '一顆水蜜桃', img: 'item_c_peach.png', fruit: true },
    orange:      { name: '軌道邊的哦潤吉？', img: 'item_c_orange.png', fruit: true },
    overlay:     { name: '這是三角？', img: 'item_t_overlay.png' },
    tile_board:  { name: '爬梯子？圈叉？', img: 'item_d_ghostleg.png', board: true },
    tile_correct:{ name: '梯形的板塊？', img: 'item_d_correct_back.png', tile: true, flip: ['item_d_correct.png', 'item_d_correct_back.png'] },
    tile_wrong:  { name: '好像可以跟什麼拚在一起', img: 'item_d_wrong.png', tile: true, flip: ['item_d_wrong.png', 'item_d_wrong_back.png'] },
  },

  // 場景：bg = bg_<名稱>.jpg；back = 往下箭頭(∨)回到哪裡；down = 是否顯示 ∨
  // 熱點 r = 位置大小；go = 切換場景；say = 顯示字幕；item = 可撿起的道具
  scenes: {
    north: { bg: 'north', hotspots: [
      { r: { top: 500, left: 700, width: 260, height: 80 }, go: 'safe' },
      { r: { top: 650, left: 790, width: 90, height: 90 }, go: 'chart' },
      { item: 'tile_board', r: { bottom: 60, right: 200, width: 130 } },
    ]},
    safe:  { bg: 'north_box',   back: 'north', down: true },
    chart: { bg: 'north_chart', back: 'north', down: true },

    east: { bg: 'east', hotspots: [
      { r: { bottom: 95, right: 155, width: 300, height: 260 }, go: 'drawer' },
      { item: 'orange', r: { bottom: 365, right: 260, width: 80 } },
      { r: { top: 354, left: 390, width: 176, height: 126 }, go: 'baseboard' },
    ]},
    drawer: { bg: 'east_drawer', back: 'east', down: true, hotspots: [
      { r: { top: 325, left: 370, width: 940, height: 140 }, go: 'drawer1' },
      { r: { top: 475, left: 370, width: 940, height: 140 }, go: 'drawer2' },
      { r: { top: 625, left: 370, width: 940, height: 140 }, go: 'drawer3' },
    ]},
    drawer1: { bg: 'east_drawer_1', hotspots: [
      { item: 'overlay', r: { top: 330, left: 780, width: 110 } },
      { r: { top: 440, left: 715, width: 240, height: 55 }, go: 'drawer' },   // 握把
    ]},
    drawer2: { bg: 'east_drawer_2', hotspots: [
      { item: 'tile_wrong', r: { top: 505, left: 788, width: 110 } },
      { r: { top: 612, left: 715, width: 240, height: 56 }, go: 'drawer' },   // 握把
    ]},
    drawer3: { bg: 'east_drawer_3', hotspots: [
      { item: 'lemon', r: { top: 656, left: 785, width: 100 } },
      { r: { top: 770, left: 715, width: 240, height: 56 }, go: 'drawer' },   // 握把
    ]},
    baseboard: { bg: 'east_baseboard', back: 'east', down: true },

    south: { bg: 'south', hotspots: [
      { r: { top: 220, left: 590, width: 500, height: 500 }, say: '過不去……' },
      { item: 'peach', r: { bottom: 120, left: 730, width: 100 } },
    ]},

    west: { bg: 'west', hotspots: [
      { r: { top: 430, left: 480, width: 300, height: 120 }, go: 'basket' },
      { item: 'apple', r: { bottom: 130, left: 540, width: 80 } },
      { item: 'tile_correct', r: { bottom: 190, right: 110, width: 70, height: 70 }, opacity: 0.95 },
    ]},
    basket: { bg: 'west_basket', back: 'west', down: true },
  },
};
