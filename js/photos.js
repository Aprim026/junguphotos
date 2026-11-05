/* ============================================================
 * 数据源 —— 空间视图与时间视图共用
 * ============================================================
 * 照片上架时在 PHOTOS 中添加：
 *   { src, city, date, location, title, note }
 *   src   真实图片地址
 *   city  需与 CITIES 中的 name 一致
 *   date  YYYY.MM.DD
 * ============================================================ */

/* ============================================================
 * 澳门 2026.02.19 —— 9 张真实照片（photos/macau/）
 * ============================================================ */
const MACAU_PHOTOS = [
  {
    src: 'photos/macau/IMG_0270.jpg',
    city: '澳门',
    date: '2026.02.19',
    location: '东望洋山麓',
    title: '紫墙下的林荫路',
    note: '午后的紫色外墙被树荫切成两半，巷子里几乎没有人声。',
  },
  {
    src: 'photos/macau/IMG_0272.jpg',
    city: '澳门',
    date: '2026.02.19',
    location: '疯堂斜巷',
    title: '红墙转角',
    note: '凤凰花开过头的季节，红墙和绿窗框在斜坡上撞了个满怀。',
  },
  {
    src: 'photos/macau/IMG_0275.jpg',
    city: '澳门',
    date: '2026.02.19',
    location: '白鸽巢前地',
    title: '粉色的窗',
    note: '旧楼窗台上的空调外机排成一列，像老城自己的表情。',
  },
  {
    src: 'photos/macau/IMG_0281.jpg',
    city: '澳门',
    date: '2026.02.19',
    location: '望德堂区',
    title: '一棵老榕树',
    note: '气根垂到地面又扎回去，这棵树大概比整条街都年长。',
  },
  {
    src: 'photos/macau/IMG_0284.jpg',
    city: '澳门',
    date: '2026.02.19',
    location: '下环街',
    title: '窄巷与陡坡',
    note: '两排老楼把天空挤成一条缝，汽车下坡时像在走垂直的窄梯。',
  },
  {
    src: 'photos/macau/IMG_0287.jpg',
    city: '澳门',
    date: '2026.02.19',
    location: '福隆新街',
    title: '旧城的坡道',
    note: '绿色铁窗花一层叠一层，坡道尽头漏下来的光是这条巷的钟表。',
  },
  {
    src: 'photos/macau/IMG_0290.jpg',
    city: '澳门',
    date: '2026.02.19',
    location: '新葡京酒店',
    title: '巷口望见新葡京',
    note: '老城的窄巷尽头忽然立起金色的莲花，两个世界在同一张照片里。',
  },
  {
    src: 'photos/macau/IMG_0297.jpg',
    city: '澳门',
    date: '2026.02.19',
    location: '关前后街',
    title: '老城扶梯',
    note: '彩色壁画裹着的自动扶梯，把人从市集慢慢送上坡顶。',
  },
  {
    src: 'photos/macau/IMG_0305.jpg',
    city: '澳门',
    date: '2026.02.19',
    location: '大三巴牌坊',
    title: '大三巴的石面',
    note: '只剩下立面也站了四百年，石头上的雕花在阴天里反而更清楚。',
  },
];

/* ============================================================
 * 相册清单 —— 按 photos/ 目录扫描结果维护
 *   dir   目录名（与磁盘一致，含空格的目录照写，生成时会做 URL 编码）
 *   date  该批照片的统一拍摄日期（YYYY.MM 或 YYYY.MM.DD）
 *   files 目录下的实际文件清单（增删文件后同步这里即可）
 * 照片数、底部统计随 files 数量自动计算
 * ============================================================ */
const ALBUMS = [
  /* ---- 2026.01 ---- */
  {
    city: '长春',
    dir: 'changchun',
    date: '2026.01',
    files: [
      'IMG_9899.jpg', 'IMG_9901.jpg', 'IMG_9902.jpg', 'IMG_9903.jpg', 'IMG_9905.jpg',
      'IMG_9909.jpg', 'IMG_9915.jpg', 'IMG_9917.jpg', 'IMG_9927.jpg', 'IMG_9947.jpg',
      'IMG_9948.jpg', 'IMG_9950.jpg', 'IMG_9953.jpg', 'IMG_9956.jpg', 'IMG_9958.jpg',
      'IMG_9960.jpg', 'IMG_9964.jpg', 'R1-03484-015A.jpg', 'R1-03484-016A.jpg', 'R1-03484-017A.jpg',
    ],
  },
  {
    city: '哈尔滨',
    dir: 'haerbin',
    date: '2026.01',
    files: [
      'C1312A3118C0A8137F41B23EC11B5EDB.jpg',
      'IMG_9774.jpg', 'IMG_9775.jpg', 'IMG_9777.jpg', 'IMG_9780.jpg', 'IMG_9781.jpg',
      'IMG_9785.jpg', 'IMG_9796.jpg', 'IMG_9812.jpg', 'IMG_9813.jpg', 'IMG_9814.jpg',
      'IMG_9819.jpg', 'IMG_9820.jpg', 'IMG_9821.jpg', 'IMG_9824.jpg', 'IMG_9825.jpg',
      'IMG_9827.jpg', 'IMG_9829.jpg', 'IMG_9837.jpg', 'IMG_9842.jpg', 'R1-03484-035A.jpg',
    ],
  },
  {
    city: '大连',
    dir: 'dalian',
    date: '2026.01',
    files: [
      'IMG_0010.jpg', 'IMG_0013.jpg', 'IMG_0016.jpg', 'IMG_0019.jpg', 'IMG_0027.jpg',
      'IMG_0029.jpg', 'IMG_0042.jpg', 'IMG_0047.jpg', 'IMG_0048.jpg', 'IMG_0051.jpg',
      'IMG_0053.jpg', 'IMG_0056.jpg', 'IMG_0057.jpg', 'IMG_0060.jpg', 'IMG_0072.jpg',
      'IMG_0074.jpg',
      'R1-03484-001A.jpg', 'R1-03484-002A.jpg', 'R1-03484-003A.jpg', 'R1-03484-004A.jpg',
      'R1-03484-005A.jpg', 'R1-03484-006A.jpg', 'R1-03484-007A.jpg', 'R1-03484-008A.jpg',
      'R1-03484-009A.jpg', 'R1-03484-010A.jpg', 'R1-03484-012A.jpg',
    ],
  },
  {
    city: '沈阳',
    dir: 'shenyang',
    date: '2026.01',
    files: [
      'IMG_0001.jpg', 'IMG_0004.jpg', 'IMG_0005.jpg', 'IMG_0009.jpg', 'IMG_9967.jpg',
      'IMG_9968.jpg', 'IMG_9969.jpg', 'IMG_9977.jpg', 'IMG_9983.jpg', 'IMG_9992.jpg',
      'IMG_9994.jpg', 'IMG_9996.jpg', 'R1-03484-013A.jpg', 'R1-03484-014A.jpg',
    ],
  },
  {
    city: '漠河',
    dir: 'mohe',
    date: '2026.01',
    files: [
      'IMG_9849.jpg', 'IMG_9850.jpg', 'IMG_9859.jpg', 'IMG_9871.jpg', 'IMG_9875.jpg',
      'IMG_9879.jpg', 'IMG_9883.jpg', 'IMG_9887.jpg',
      'R1-03484-018A.jpg', 'R1-03484-023A.jpg', 'R1-03484-025A.jpg', 'R1-03484-026A.jpg',
    ],
  },

  /* ---- 2023 ---- */
  {
    city: '长沙',
    dir: 'changsha',
    date: '2023',      /* 表格只给了年份 */
    files: [
      'E6D072535378E61CB20F8F13A19F86F3.jpg',
    ],
  },
  {
    city: '扬州',
    dir: 'yangzhou',
    date: '2023.06',
    files: [
      '04A2D50A6C572FBFFC75B08E83FA3DC7.jpg', '784F2836D21C77A290F268C02695CB8D.jpg',
      'D85D1B7ED13F8CF5BE428892F95007CB.jpg',
    ],
  },
  {
    city: '南京',
    dir: 'nanjing',
    date: '2023.06',
    files: [
      '3EE0ED750E53AB188D654D61BE5EC68F.jpg', 'C2B450C9CAAD256B812500903C641197.jpg',
    ],
  },
  {
    city: '镇江',
    dir: 'zhenjiang',
    date: '2023.06',
    files: [
      'B344B69047297BC5B3616C6F1BA3ACC1.jpg',
    ],
  },

  /* ---- 2023.12 ---- */
  /* 武汉：wuhan23/ 目录（2023.12.02），挂到「武汉」城市下 */
  {
    city: '武汉',
    dir: 'wuhan23',
    date: '2023.12.02',
    files: [
      'D5AE80DDD68A900C65FD152A9B436904.jpg',
    ],
  },

  /* ---- 2024 ---- */
  /* 武汉：wuhan24/ 目录（2024 年批），列表 2024 分组独立入口 */
  {
    city: '武汉',
    dir: 'wuhan24',
    date: '2024',
    files: [
      '2ee6a84ac8b38614cb3d8692da609b09.jpg', '3f23cb6175534cf6d643208332e34fef.jpg',
      '50ac9e44fad9b661e1e57117c76adc0a.jpg', '6ab15f6b27ab384dabe34f3fa8d18046.jpg',
      '70ac8acca27c1048ef574925b5a8f079.jpg', '895dc1455f4444d0ccce57b11bbac5dd.jpg',
      'a80c1374ffc3a8182c2f9604779d9e9e.jpg', 'afb0b6224c2724665b3c1610e8919ce9.jpg',
      'b96462accb6097d10175099e5b2f2dbe.jpg', 'b995a06af75689478cfa242af6f1e789.jpg',
      'ce3eb0299e5712c1258f8cabd25ca9a2.jpg', 'd6a6862e2fe171ddcf3269d1aace6dce.jpg',
      'fb0ad6162a25d7c72ac31085b098431c.jpg',
    ],
  },
  {
    city: '重庆',
    dir: 'chongqing',
    date: '2024.01',
    files: [
      '263EC474B54388AEB03D17B58C34B0ED.jpg', '2E51E72D4994BCF73D0DB3139CB6D99D.jpg',
      '369291452C18420998365CFB426246BB.jpg', '467CD354AE62137C6D7887357C59BAE7.jpg',
      '918C98ADBB687534CF37678B08D4E4F5.jpg',
    ],
  },
  {
    city: '广州',
    dir: 'guangzhou',
    date: '2024.05',
    files: [
      '95B692932C38A8617E78C607FAC3E2AB.jpg', 'AAEF8D5B5A993EB2CC4196FE8ECE2254.jpg',
      'E900359DAF4DAA1A6BB70153290B0CB4.jpg', 'ED1AA63D40C1830948930E65AAC7B899.jpg',
      'FD241109AEF41520A09448B7CB1B05E8.jpg', 'FEB4F9F7724F035460E8367A14D5AC55.jpg',
      'FFF9444958F37BB4812ABD1679B97058.jpg',
    ],
  },
  {
    city: '香港',
    dir: 'hongkong24',    /* 目录已由 hongkong/ 重命名为 hongkong24/ */
    date: '2024.08.16',
    files: [
      '2EE73E9A1CEC173540B703B731A838F8.jpg', '3F22CEF7B00DB46B43C02B31165067FB.jpg',
      'ACF3D3E882668618892B2269F2C66FB8.jpg',
    ],
  },
  {
    city: '雄安新区',
    dir: 'xiongan',
    date: '2024.07.06',
    files: [
      '66875D6D5191C91655649481ADA5AB2D.jpg',
    ],
  },
  {
    city: '南昌',
    dir: 'nanchang',
    date: '2024.08.26',
    files: [
      '0CB305E6F84EC82B4BD9BA64F3610EB3.jpg',
    ],
  },
  {
    city: '萍乡',
    dir: 'pingxiang',
    date: '2024.08.30',
    files: [
      '9DA6AE3E1DF65337F401CA689E74562F.jpg', 'D165B55FE550CDE45AA89079AB84CD29.jpg',
    ],
  },

  /* ---- 2025 ---- */
  /* 武汉：wuhan25/ 目录（2025 年批），列表 2025 分组独立入口 */
  {
    city: '武汉',
    dir: 'wuhan25',
    date: '2025',
    files: [
      '17a0d082e6580793d3ae63e2d53e3ab0.jpg', '1fb195c65f29a020c52c76b57f3ba50e.jpg',
      '36cb70aac7c9e21a26aeab529fd79991.jpg', '3d38e2ddf587f9c9d431a8031e29ba18.jpg',
      '45b2e6026c2f034b05deb32405b290ed.jpg', '6d647b1475bc1023fce53484d1e5dc34.jpg',
      '7bb871fe472fc60874b110b0ab972600.jpg', '7ca62bc79f84b2d53cf76823182babe7.jpg',
      '7ddfecdf30ac3bf308ab103ad1de0d51.jpg', 'acc919fed9e3620aecf7107332bd6a34.jpg',
      'd04329fe0d88aaaa8b01d88ce367d057.jpg', 'dbf66ca9451b7eb09d305a89bd1c9ba4.jpg',
      'e50254fd28cdda3ed7a69fede4fbfb7c.jpg', 'IMG_9622.jpg',
    ],
  },
  {
    city: '黄山',
    dir: 'huangshan',
    date: '2025.04.04',
    files: [
      '0635B9D81B9925155B8AF2C5E37CA129.jpg', '119EA8D6398D78A23023D6CE7A551CC1.jpg',
      '5F856BBC5157747AE0CFF0556127774F.jpg', 'CD624C5066C652F80A12A0ABA030A664.jpg',
      'F321BFB8ECEBB1F8FA300A4B0E73CAC2.jpg',
    ],
  },
  /* ---- 2025.05 ---- */
  {
    city: '上海',
    dir: 'shanghai',
    date: '2025.05',
    files: [
      '02A2D1BA16F1D4EADE98D2DA25BA799E.jpg', '0CF908A57BDA0CF1932BCF7F4A806B2B.jpg',
      '1C67E1B6392AF870206BA56E618CABE4.jpg', '2677C5B69A65A1339D0CC0CBF6A86BAA.jpg',
      '4C6E62C8E46C02BEF317CDE3FE0F291A.jpg', '57038CE75FF061E7B4654C3AC402B7F0.jpg',
      '7429B5F41A8677E26176FE4A6F819C64.jpg', '87718E054DE87372C71CB528F15845EE.jpg',
      '91147A7CC724457D113A4C56E4EA1A96.jpg', 'A5F2326ECC05919AA72B700E2501E338.jpg',
      'E968A3C58C182BBCA5ECF2C4C1E0C0B9.jpg',
    ],
  },

  /* ---- 2025.08 ---- */
  {
    city: '杭州',
    dir: 'hangzhou',
    date: '2025.08.15',
    files: [
      '33C10BFE3E463A3A15E2FBF943FE2AB7.jpg', '479724CB1FD90E92D74AE13B5F9BB52E.jpg',
      '668BB0F6FE2AB3107A7D51878952E8F6.jpg', '7B7517367494A5C7C569E4FFF9189618.jpg',
    ],
  },
  {
    city: '苏州',
    dir: 'suzhou',
    date: '2025.08.18',
    files: [
      '2C6EBA3E847029E0200CDAD345CF036F.jpg', '2F26830AAA8DEC07289D83E91E7C5FA9.jpg',
      '6276C8E3377CC39758B02769DD35DFFE.jpg', '74AD5DE2DFEA2F0AD32648959C882BF3.jpg',
      '9F65684429921DEED7DBB8BD9EB9417F.jpg', 'DE174B9D6939855CD3CB0053C8D91DDC.jpg',
    ],
  },

  /* ---- 2026 ---- */
  /* 武汉：wuhan26/ 目录（2026 年批），列表 2026 分组独立入口 */
  {
    city: '武汉',
    dir: 'wuhan26',
    date: '2026',
    files: [
      '000001.jpg', '000002.jpg', '000043.jpg',
      '09a61714ee97f8888e9822643c16ece3.jpg', '0b791f2b1a8d6527c83f1fbcb22eceea.jpg',
      '16411969c18e0ae9b575c0a003967469.jpg', '1f439687414e56e6f11eff851dd1155a.jpg',
      'a479313065964a5342ddad20b7d35403.jpg', 'b5d56c6da8e17f72354efb4719518d4a.jpg',
      'cd83b159201852b0c89ed2f6eb046b07.jpg', 'DSC00979.jpg', 'DSC00984.jpg',
      'e2d67006829f090fb00d80c5c912bae3.jpg', 'eb022fd67ae63caccf89df4f639b08b6.jpg',
    ],
  },

  /* ---- 2026.01 ---- */
  /* 香港：hongkong26/ 目录（2026.01.31，原 hongkong2/），与 hongkong24/ 的 2024.08.16 同挂「香港」城市下 */
  {
    city: '香港',
    dir: 'hongkong26',
    date: '2026.01.31',
    files: [
      '0ABFF3BC1942316A3B571B8AF5693785.jpg', '40B8FB710DC0F8C467F06740001A462F.jpg',
      '41EE557763FA1A9569BAAE60290BE426.jpg', '4CB3B3DB77583E3E8A926600A06A10C9.jpg',
      'BCE69A780281F9A8E245A7A4F7902771.jpg', 'CFC8986D15AB0DE45BB65E6B6982AF1F.jpg',
      'EAD11665D852278BD21A0C430908A32A.jpg', 'EFC23534BAF35C4135019448A6CB52F4.jpg',
      'FAF4D02961DD3B5EAEBD4E5BCD06A6AC.jpg',
    ],
  },

  /* ---- 2024.08 ---- */
  /* 深圳：2024 批（shenzhen24/），列表 2024 分组 */
  {
    city: '深圳',
    dir: 'shenzhen24',
    date: '2024.08',
    files: [
      '560948e9d21a727c097d885b7916f18c.jpg', 'bd8cb42fec79b374bde45362f7c92820.jpg',
      'ef037861224bfac873448f1e01ce7bb3.jpg',
    ],
  },

  /* ---- 2026.02 ---- */
  /* 深圳：2026 批（shenzhen26/，原 shenzhen/ 目录的 8 张），列表 2026 分组 */
  {
    city: '深圳',
    dir: 'shenzhen26',
    date: '2026.02',
    files: [
      'IMG_0208.jpg', 'IMG_0216.jpg', 'IMG_0220.jpg', 'IMG_0236.jpg',
      'IMG_0250.jpg', 'IMG_0263.jpg', 'IMG_0265.jpg', 'IMG_0267.jpg',
    ],
  },

  /* ---- 2026.05 ---- */
  {
    city: '青岛',
    dir: 'qingdao',
    date: '2026.05',
    files: [
      '000042.jpg', '000043.jpg', '000044.jpg', '000045.jpg', '000046.jpg', '000047.jpg',
      '000048.jpg', '000049.jpg', '000050.jpg', '000051.jpg', '000052.jpg', '000053.jpg',
      '000054.jpg', '000056.jpg', '000057.jpg', '000058.jpg', '000059.jpg', '000060.jpg',
      '000061.jpg', '000062.jpg', '000063.jpg', '000064.jpg', '000065.jpg', '000066.jpg',
      '000067.jpg',
      'IMG_9853.jpg', 'IMG_9860.jpg', 'IMG_9861.jpg', 'IMG_9866.jpg', 'IMG_9867.jpg',
      'IMG_9890.jpg', 'IMG_9892.jpg', 'IMG_9894.jpg', 'IMG_9899.jpg', 'IMG_9909.jpg',
      'IMG_9913.jpg', 'IMG_9918.jpg', 'IMG_9921.jpg',
    ],
  },
  {
    city: '连云港',
    dir: 'lianyugang',
    date: '2026.05',
    files: [
      '000001.jpg', '000002.jpg', '000003.jpg', '000004.jpg', '000005.jpg', '000006.jpg',
      '000038.jpg', '000039.jpg', '000040.jpg', '000041.jpg',
      'IMG_9773.jpg', 'IMG_9774.jpg', 'IMG_9777.jpg', 'IMG_9784.jpg', 'IMG_9786.jpg',
      'IMG_9789.jpg', 'IMG_9790.jpg', 'IMG_9792.jpg', 'IMG_9793.jpg', 'IMG_9809.jpg',
      'IMG_9811.jpg', 'IMG_9812.jpg', 'IMG_9817.jpg', 'IMG_9824.jpg', 'IMG_9826.jpg',
      'IMG_9838.jpg', 'IMG_9839.jpg', 'IMG_9843.jpg',
    ],
  },

  /* ---- 2026.06 ---- */
  {
    city: '天津',
    dir: 'tianjin',
    date: '2026.06',
    files: [
      '000003.jpg', '000004.jpg', '000005.jpg', '000006.jpg', '000038.jpg',
      '15199B6F217379C837B3F847702C23E4.jpg', '41EF85E2B608DFD160583FF11DFEE251.jpg',
      '4FBB764B71A7EB4316501A1427A9ADB7.jpg', '757F0AFBEEC77C11F622005A30C50884.jpg',
      '8D587BD90C43C92697C0E8E863BB50AE.jpg', 'D36C4047EFC29E1C0DEF5B7582E073EE.jpg',
      'F34016A8841DB0F89287DDA06546AC5E.jpg',
      'DSC00045.jpg', 'DSC00050.jpg', 'DSC00057.jpg', 'DSC00062.jpg',
      'DSC00068.jpg', 'DSC00072.jpg',
    ],
  },

  /* ---- 2026.10 ---- */
  {
    city: '莫斯科',
    dir: 'moscow',
    date: '2026.10',
    files: [
      '000047.jpg', '000048.jpg', '000049.jpg', '000050.jpg', '000051.jpg',
      'DSC00813.jpg', 'DSC00817.jpg', 'DSC00821.jpg', 'DSC00823.jpg', 'DSC00827.jpg',
      'DSC00834.jpg', 'DSC00836.jpg', 'DSC00843.jpg', 'DSC00845.jpg', 'DSC00846.jpg',
      'DSC00848.jpg', 'DSC00856.jpg', 'DSC00858.jpg', 'DSC00860.jpg', 'DSC00861.jpg',
      'DSC00862.jpg', 'DSC00864.jpg', 'DSC00865.jpg', 'DSC00875.jpg', 'DSC00881.jpg',
      'DSC00882.jpg',
    ],
  },
  {
    city: '圣彼得堡',
    dir: 'saint petersburg',   /* 磁盘目录名带空格，生成 src 时会做 URL 编码 */
    date: '2026.10',
    files: [
      '000030.jpg', '000051.jpg', '000052.jpg', '000053.jpg', '000054.jpg', '000055.jpg',
      '000056.jpg', '000057.jpg', '000058.jpg', '000059.jpg', '000060.jpg', '000062.jpg',
      '000063.jpg', '000064.jpg', '000065.jpg', '000066.jpg', '000067.jpg',
      'DSC00677.jpg', 'DSC00680.jpg', 'DSC00685.jpg', 'DSC00689.jpg', 'DSC00692.jpg',
      'DSC00694.jpg', 'DSC00695.jpg', 'DSC00697.jpg', 'DSC00699.jpg', 'DSC00701.jpg',
      'DSC00705.jpg', 'DSC00707.jpg', 'DSC00710.jpg', 'DSC00711.jpg', 'DSC00716.jpg',
      'DSC00719.jpg', 'DSC00721.jpg', 'DSC00725.jpg', 'DSC00727.jpg', 'DSC00730.jpg',
      'DSC00744.jpg', 'DSC00749.jpg', 'DSC00751.jpg', 'DSC00760.jpg', 'DSC00761.jpg',
      'DSC00764.jpg', 'DSC00769.jpg', 'DSC00777.jpg', 'DSC00780.jpg', 'DSC00788.jpg',
      'DSC00790.jpg', 'DSC00792.jpg', 'DSC00794.jpg', 'DSC00796.jpg', 'DSC00798.jpg',
    ],
  },
];

/* 由相册清单生成照片记录：src / city / date / location / title / note 结构保持不变 */
const ALBUM_PHOTOS = ALBUMS.flatMap(({ city, dir, date, files }) =>
  files.map((file, i) => ({
    src: encodeURI(`photos/${dir}/${file}`),
    city,
    date,
    location: city,
    title: `${city} · ${String(i + 1).padStart(2, '0')}`,
    note: '',
  }))
);

/* 全部照片：澳门手写条目 + 相册自动生成条目
 * thumb：photos/thumbs/ 下的轻量缩略图（长边 900px，供胶片/面板网格加载）；
 * src 始终指向原图（供灯箱全屏放大）。新目录生成缩略图：运行 make-thumbs.ps1 */
const PHOTOS = [...MACAU_PHOTOS, ...ALBUM_PHOTOS].map((p) => ({
  ...p,
  thumb: p.src.replace(/^photos\//, 'photos/thumbs/'),
}));

/* ============================================================
 * 城市数据（28 座，按首次到访年份归类）
 *   adcode  高德行政区划代码（用于 DistrictLayer 边界；无则只放 marker）
 *   lat/lon 经纬度（marker 定位）
 *   zoom    点击后建议缩放级别（可选，默认 8）
 *   year    首次到访年份（左侧列表分组）
 * 武汉多次到访（2023/2024/2026），列表中归入 2023，并作为连线放射中心
 * ============================================================ */

const CITIES = [
  /* ---- 2023 ---- */
  { name: '南京',     en: 'NANJING',        country: '中国',   province: '江苏省',           cityFull: '南京市',     adcode: '320100', lat: 32.0603, lon: 118.7969, year: 2023 },
  { name: '镇江',     en: 'ZHENJIANG',      country: '中国',   province: '江苏省',           cityFull: '镇江市',     adcode: '321100', lat: 32.1877, lon: 119.4250, year: 2023 },
  { name: '扬州',     en: 'YANGZHOU',       country: '中国',   province: '江苏省',           cityFull: '扬州市',     adcode: '321000', lat: 32.3942, lon: 119.4129, year: 2023 },
  { name: '武汉',     en: 'WUHAN',          country: '中国',   province: '湖北省',           cityFull: '武汉市',     adcode: '420100', lat: 30.5928, lon: 114.3055, year: 2023, listAlso: [2024, 2025, 2026] },
  { name: '长沙',     en: 'CHANGSHA',       country: '中国',   province: '湖南省',           cityFull: '长沙市',     adcode: '430100', lat: 28.2282, lon: 112.9388, year: 2023 },

  /* ---- 2024 ---- */
  { name: '重庆',     en: 'CHONGQING',      country: '中国',   province: '重庆市',           cityFull: '重庆',       adcode: '500000', lat: 29.5630, lon: 106.5516, year: 2024, zoom: 7 },
  { name: '广州',     en: 'GUANGZHOU',      country: '中国',   province: '广东省',           cityFull: '广州市',     adcode: '440100', lat: 23.1291, lon: 113.2644, year: 2024 },
  /* 雄安新区是国家级新区，同样无标准 DistrictLayer 面数据 → 走兜底 */
  { name: '雄安新区', en: "XIONG'AN",       country: '中国',   province: '河北省',           cityFull: '雄安新区',   adcode: '133100', lat: 38.9000, lon: 116.1000, year: 2024, zoom: 9, boundaryAlt: 'search', r: 20000 },
  { name: '深圳',     en: 'SHENZHEN',       country: '中国',   province: '广东省',           cityFull: '深圳市',     adcode: '440300', lat: 22.5431, lon: 114.0579, year: 2024, listAlso: [2026] },
  { name: '南昌',     en: 'NANCHANG',       country: '中国',   province: '江西省',           cityFull: '南昌市',     adcode: '360100', lat: 28.6820, lon: 115.8579, year: 2024 },
  { name: '萍乡',     en: 'PINGXIANG',      country: '中国',   province: '江西省',           cityFull: '萍乡市',     adcode: '360300', lat: 27.6229, lon: 113.8547, year: 2024, zoom: 9 },

  /* ---- 2025 ---- */
  { name: '黄山',     en: 'HUANGSHAN',      country: '中国',   province: '安徽省',           cityFull: '黄山市',     adcode: '341000', lat: 29.7147, lon: 118.3376, year: 2025 },
  { name: '上海',     en: 'SHANGHAI',       country: '中国',   province: '上海市',           cityFull: '上海',       adcode: '310000', lat: 31.2304, lon: 121.4737, year: 2025, zoom: 9 },
  { name: '杭州',     en: 'HANGZHOU',       country: '中国',   province: '浙江省',           cityFull: '杭州市',     adcode: '330100', lat: 30.2741, lon: 120.1551, year: 2025 },
  { name: '湖州',     en: 'HUZHOU',         country: '中国',   province: '浙江省',           cityFull: '湖州市',     adcode: '330500', lat: 30.8703, lon: 120.0933, year: 2025, zoom: 9 },
  { name: '苏州',     en: 'SUZHOU',         country: '中国',   province: '江苏省',           cityFull: '苏州市',     adcode: '320500', lat: 31.2989, lon: 120.5853, year: 2025, zoom: 9 },

  /* ---- 2026 ---- */
  { name: '香港',     en: 'HONG KONG',      country: '中国',   province: '香港特别行政区',   cityFull: '香港',       adcode: '810000', lat: 22.3193, lon: 114.1694, year: 2024, listAlso: [2026], zoom: 10 },
  { name: '澳门',     en: 'MACAU',          country: '中国',   province: '澳门特别行政区',   cityFull: '澳门',       adcode: '820000', lat: 22.1987, lon: 113.5439, year: 2026, zoom: 11 },
  { name: '长春',     en: 'CHANGCHUN',      country: '中国',   province: '吉林省',           cityFull: '长春市',     adcode: '220100', lat: 43.8171, lon: 125.3235, year: 2026 },
  { name: '哈尔滨',   en: 'HARBIN',         country: '中国',   province: '黑龙江省',         cityFull: '哈尔滨市',   adcode: '230100', lat: 45.8038, lon: 126.5349, year: 2026 },
  /* 漠河为县级市（大兴安岭地区代管），DistrictLayer 无面数据 → boundaryAlt 走搜索/圆形兜底 */
  { name: '漠河',     en: 'MOHE',           country: '中国',   province: '黑龙江省',         cityFull: '漠河市',     adcode: '232701', lat: 53.4713, lon: 122.5302, year: 2026, zoom: 8, boundaryAlt: 'search', r: 8000 },
  { name: '沈阳',     en: 'SHENYANG',       country: '中国',   province: '辽宁省',           cityFull: '沈阳市',     adcode: '210100', lat: 41.8057, lon: 123.4315, year: 2026 },
  { name: '大连',     en: 'DALIAN',         country: '中国',   province: '辽宁省',           cityFull: '大连市',     adcode: '210200', lat: 38.9140, lon: 121.6147, year: 2026, zoom: 9 },
  { name: '连云港',   en: 'LIANYUNGANG',    country: '中国',   province: '江苏省',           cityFull: '连云港市',   adcode: '320700', lat: 34.5967, lon: 119.2216, year: 2026, zoom: 9 },
  { name: '青岛',     en: 'QINGDAO',        country: '中国',   province: '山东省',           cityFull: '青岛市',     adcode: '370200', lat: 36.0671, lon: 120.3826, year: 2026, zoom: 9 },
  { name: '天津',     en: 'TIANJIN',        country: '中国',   province: '天津市',           cityFull: '天津',       adcode: '120000', lat: 39.0842, lon: 117.2009, year: 2026, zoom: 9 },
  { name: '莫斯科',   en: 'MOSCOW',         country: '俄罗斯', province: '俄罗斯',           cityFull: '莫斯科',     adcode: null,     lat: 55.7558, lon: 37.6173, year: 2026, zoom: 8 },
  { name: '圣彼得堡', en: 'ST. PETERSBURG', country: '俄罗斯', province: '俄罗斯',           cityFull: '圣彼得堡',   adcode: null,     lat: 59.9311, lon: 30.3609, year: 2026, zoom: 8 },
];

/* 放射状连线的出发点 */
const HUB_CITY = '武汉';

/* ============================================================
 * 年份文案（时间视图）
 * ============================================================ */

const YEAR_NOTES = {
  2023: '二十四桥仍在，波心荡，冷月无声',
  2024: '总是走在漫长的路上',
  2025: '自在飞花轻似梦，无边丝雨细如愁',
  2026: '静静的村庄飘着白的雪',
};

const YEAR_INTROS = {
  2023: '满城风絮，梅子黄时',
  2024: '夜雨后，是海城的风',
  2025: '江南的雨慢慢落',
  2026: '向北，直到白夜',
};
