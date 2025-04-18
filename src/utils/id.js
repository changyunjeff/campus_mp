
import FlakeId from 'flake-idgen'
import intformat from 'biguint-format'

const flakeIdGen = new FlakeId()

export function generateID() {
    // 利用雪花算法生成ID
    const id = intformat(flakeIdGen.next(), 'dec')
    console.debug('生成的id：', id)
    return id
}
