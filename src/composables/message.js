import { useConnection } from "./connection";
import { useUserStore } from "@/pinia/modules/user";
import {MSG_TYPE, MSG_METHOD} from "@/constants/msg";

let instance = null;

export function useMessage() {
  if (instance) return instance;

  const connect = useConnection();
  const userStore = useUserStore();

  connect.registerHandler(MSG_TYPE.Chat, (msg) => {
    console.log('收到消息', msg);
  });

  const sendChat = async (userID, content) => {
    if (!!userID==false) {
      throw new Error('请输入对方的openid')
    }
    if (!!content==false) {
      throw new Error('请输入消息内容')
    }
    const msg = {
        id: utils.generateID(),
        createAt: new Date().getTime(),
        from: userStore.openid,
        to: userID,
        content: content,
        type: MSG_TYPE.Chat,
        method: MSG_METHOD.CheckSensitive|MSG_METHOD.Redirect,
    };
    try {
        await connect.sendText(msg);
    } catch (err) {
        console.error(e.message);
        throw err;
    }
  }

  instance = {
    sendChat
  }
  return instance;
}
