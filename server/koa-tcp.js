const koa = require('koa')
const Router = require('koa-router')
const ws = require('koa-websocket')

const app = ws(new koa())
const router = new Router()

/**
 * 服务端给客户端的聊天信息格式
 * {
    id: lastid,
    showTime: 是否展示时间,
    time: nowDate,
    type: type,
    userinfo: {
      uid: this.myuid,
      username: this.username,
      face: this.avatar,
    },
    content: {
      url:'',
      text:'',
      w:'',
      h:''
    },
  }
  消息数据队列的队头为最新消息，以次往下为老消息
  客户端展示需要reverse(): 客户端聊天窗口最下面需要为最新消息，所以队列尾部为最新消息，以此往上为老消息
 */


router.all('/websocket/:id', async (ctx) => {
  // const query = ctx.query
  console.log(JSON.stringify(ctx.params))
  ctx.websocket.send('我是小服，告诉你连接成功啦')
  ctx.websocket.on('message', (res) => {
    console.log(`服务端收到消息, ${res}`)
    let data = JSON.parse(res)
    if (data.type === 'chat') {
      ctx.websocket.send(`我也会说${data.text}`)
    }
  })
  ctx.websocket.on('close', () => {
    console.log('服务端关闭')
  })
})

// 将路由中间件添加到Koa应用中  
app.ws.use(router.routes()).use(router.allowedMethods())

app.listen(9001, () => {
  console.log('socket is connect')
})

