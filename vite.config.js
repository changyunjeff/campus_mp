import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import Components from '@uni-helper/vite-plugin-uni-components'
import { WotResolver } from '@uni-helper/vite-plugin-uni-components/resolvers'
import UniPages from '@uni-helper/vite-plugin-uni-pages'
import uni from '@dcloudio/vite-plugin-uni'

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
      dts: true,
      resolvers: [WotResolver()]
    }),
      // https://github.com/uni-helper/vite-plugin-uni-pages
    UniPages(),
      uni(),
      UnoCSS(),
    ],
  }
})



