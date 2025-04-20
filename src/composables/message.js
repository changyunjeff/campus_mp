import { useConnection } from "./connection";
import { useUserStore } from "@/pinia/modules/user";
import { useMessageHisotry } from "./message_history";
import { MSG_TYPE, MSG_METHOD } from "@/constants/msg";

/**
 * @property {function} sendChat
 */
let instance = null;

export function useMessage() {
  if (instance) return instance;

  const connect = useConnection();
  const userStore = useUserStore();
  const history = useMessageHisotry();

  connect.registerHandler(MSG_TYPE.Chat, (msg) => {
    console.log('收到消息', msg);
  });

  const sendChat = async (id, userID, content) => {
    if (!!userID===false) {
      throw new Error('请输入对方的openid')
    }
    if (!!content===false) {
      throw new Error('请输入消息内容')
    }
    /**
     * @type {Message}
     */
    const msg = {
        id: id,
        timestamp: new Date().getTime(),
        from: userStore.openid,
        to: userID,
        content: content,
        type: MSG_TYPE.Chat,
        method: MSG_METHOD.CheckSensitive|MSG_METHOD.Redirect,
    };
    try {
        await connect.send(msg);
        history.add(msg.to, msg)
    } catch (err) {
        console.error(err.message);
        throw err;
    }
  }

  instance = {
    sendChat
  }
  return instance;
}
