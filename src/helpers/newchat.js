import Time from '@/helpers/time.js'
export function chatFormat(res, options = { isCircle: false }, data) {
  const { isCircle } = options
  switch (options.type) {
    case 'chatList':
      if (isCircle) {
        let obj = {
          circleId: res.body.circleId,
          circleName: res.body.circleName,
          avatar: res.body.circleImg,
          circleType: res.body?.circleType,
          time: res.body.createTime,
          data: formatMsg(res.body.type, {
            username: res.body?.username,
            content: res.body.content,
            isCircle
          }),
          noReadNum: 0 // 未读数
        }
        // 本人发送的信息
        if (res.body.userId == data.userId) {
          obj.data = formatMsg(res.body.type, {
            content: res.body.content,
            isCircle,
            isMe: true
          })
        }
        return obj
      }

      let obj = {
        userId: res.body.userId,
        username: res.body.username,
        avatar: res.body.userImg,
        time: res.body.createTime,
        data: formatMsg(res.body.type, { content: res.body.content }),
        noReadNum: 0 // 未读数
      }
      // 本人发送的信息
      if (res.body.userId == data.userId) {
        obj.userId = data.toUser
        obj.username = data.toUserName
        obj.avatar = data.toUserAvatar
      }
      return obj

    case 'chatDetail':
      const list = options.oldData || []
      const lastTime =
        list?.length > 0
          ? [...list].reverse().find((i) => i.msg.time).msg.time
          : 0
      let lastId = list?.length > 0 ? list[list.length - 1].msg.id : -1
      lastId++
      return {
        type: 'user',
        msg: {
          id: lastId,
          type: res.body.type,
          showTime: Time.noFormatChatTime(res.body.createTime, lastTime),
          time: res.body.createTime,
          userinfo: {
            uid: res.body.userId,
            username: isCircle ? res.body.username : '',
            face: res.body.userImg
          },
          content: res.body.content
        }
      }

    case 'send':
      if (isCircle) {
        return {
          type: sendCircleType,
          body: {
            type: res.msg.type,
            circleId: data.circleId,
            circleName: data.circleName,
            circleImg: data.circleAvatar,
            circleType: data.circleType,
            userId: data.userId,
            userImg: data.avatar,
            content: res.msg.content,
            createTime: new Date().getTime()
          }
        }
      }
      return {
        type: sendOneType,
        body: {
          type: res.msg.type,
          userId: data.userId,
          username: data.username,
          userImg: data.avatar,
          toUser: data.toUser,
          content: res.msg.content,
          createTime: new Date().getTime()
        }
      }
  }
}

export function formatMsg(type, options = { isCircle: false, isMe: false }) {
  let data
  if (type === textType) {
    data = options.content.text.replace(/\n/g, ' ')
  } else if (type === imgType) {
    data = '[图片]'
  } else if (type === voiceType) {
    data = '[语音]'
  }

  if (options.isCircle && !options.isMe) data = options.username + '：' + data
  return data
}

// 格式化历史聊天消息
export function chatDetailFormat(list) {
  if (list.length === 0) return []
  let chatDetail = []
  list.map((i) => {
    chatDetail.push({
      type: 'user',
      msg: {
        id: i.id,
        type: i.type || 'text',
        showTime: i.show,
        time: i.createTime,
        userinfo: {
          uid: i.userInfo.userId,
          username: i.userInfo.username,
          face: i.userInfo.face
        },
        content: i.context
      }
    })
  })

  return chatDetail.sort((a, b) => a.msg.time - b.msg.time)
}