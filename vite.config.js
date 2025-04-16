import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import Components from '@uni-helper/vite-plugin-uni-components'
import { WotResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import uni from '@dcloudio/vite-plugin-uni'
import AutoImport from 'unplugin-auto-import/vite'

export default defineConfig(async () => {
  const UnoCSS = (await import('unocss/vite')).default

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    plugins: [
      Components({
        dts: "src/types/components.d.ts",
        resolvers: [WotResolver()]
      }),
      // https://github.com/uni-helper/vite-plugin-uni-pages
      UniPages(),
      uni(),
      UnoCSS(),
      AutoImport({
        imports: ['vue', {
          'uni-mini-router': ['useRouter', 'useRoute']
        }],
        dts: "src/types/auto-import.d.ts",
        dirs: [
          'src/composables',
          'src/components',
          'layout'
        ]
      }),
    ],
  }
})



