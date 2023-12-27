<template>
  <view>
    <!-- 内容 -->
    <view class="content" @touchstart="hideDrawer">
      <scroll-view
        class="msg-list"
        :style="style"
        :scroll-y="true"
        :adjust-position="false"
        :scroll-top="scrollTop"
        :scroll-with-animation="scrollAnimation"
        @scrolltoupper="reachTop"
        @scrolltolower="reachBottom"
        upper-threshold="50"
      >
        <!-- 加载历史数据waitingUI -->
        <view class="loading" v-if="showLoading">
          <view class="spinner">
            <view class="rect1"></view>
            <view class="rect2"></view>
            <view class="rect3"></view>
            <view class="rect4"></view>
            <view class="rect5"></view>
          </view>
        </view>
        <div class="mainArea" id="mainArea">
          <view
            class="row"
            v-for="(row, index) in msgList"
            :key="index"
            :id="'msg' + row.id"
          >
            <!-- 时间 -->
            <view
              v-show="row.showTime"
              class="text-sm text-gray text-center margin-tb-sm"
              style="width: 100%"
            >
              {{ formatTime(row.time) }}
            </view>
            <!-- 自己发出的消息 -->
            <view class="my" v-if="row.userinfo.uid == myuid">
              <!-- 左-消息 -->
              <view class="left">
                <!-- 文字消息 -->
                <view
                  v-if="row.type == 'text'"
                  class="bubble"
                  style="white-space: pre-wrap"
                >
                  <rich-text :nodes="row.content.text"></rich-text>
                </view>
              </view>
              <!-- 右-头像 -->
              <view class="right">
                <image :src="row.userinfo.face"></image>
              </view>
            </view>
            <!-- 别人发出的消息 -->
            <view class="other" v-if="row.userinfo.uid != myuid">
              <!-- 左-头像 -->
              <view class="left">
                <image :src="row.userinfo.face"></image>
              </view>
              <!-- 右-用户名称-时间-消息 -->
              <view class="right">
                <!-- 文字消息 -->
                <view v-if="row.type == 'text'" class="bubble">
                  <rich-text
                    :nodes="row.content.text"
                    style="white-space: pre-wrap"
                  ></rich-text>
                </view>
              </view>
            </view>
          </view>
        </div>
      </scroll-view>
    </view>
    <!-- 抽屉栏 -->
    <view
      class="popup-layer"
      :class="popupLayerClass"
      @touchmove.stop.prevent="discard"
    >
      <!-- 更多功能 相册-拍照 -->
      <view class="more-layer" :class="{ hidden: hideMore }">
        <view class="list">
          <view class="box" @tap="chooseImage">
            <view class="icon tupian2"></view>
            <uni-icons type="image" size="42"></uni-icons>
          </view>
          <view class="box" @tap="camera">
            <uni-icons type="camera" size="42"></uni-icons>
          </view>
        </view>
      </view>
    </view>
    <!-- 底部输入栏 -->
    <view
      class="input-box"
      :class="popupLayerClass"
      @touchmove.stop.prevent="discard"
    >
      <!-- #ifdef H5 -->
      <view class="more" @tap="showMore">
        <uni-icons type="plus-filled" size="40"></uni-icons>
      </view>
      <!-- #endif -->
      <view class="textbox">
        <view class="text-mode isVoice">
          <view class="box">
            <textarea
              :auto-height="true"
              :show-confirm-bar="false"
              :cursor-spacing="30"
              :maxlength="341"
              v-model="textMsg"
              @focus="textareaFocus"
            />
          </view>
        </view>
      </view>
      <view class="send" @tap="sendText">
        <view class="btn">发送</view>
      </view>
    </view>
  </view>
</template>

<script>
  import Time from "@/helpers/time.js";
  // import { addData, getData } from "@/api";
  let ws = null;
  export default {
    data() {
      return {
        // 标题
        title: "",
        // loading
        showLoading: false,
        //文字消息
        textMsg: "",
        //消息列表
        scrollAnimation: false,
        msgList: [],
        msgImgList: [],
        myuid: 0,
        // 历史聊天记录分页
        defaultOffset: 1,
        offset: 2,
        // 是否位于页面最底部
        isBottom: true,
        // 抽屉参数
        popupLayerClass: "",
        // more参数
        hideMore: true,
        scrollTop: 0,
      };
    },

    computed: {
      chatHeight() {
        const CustomBar = this.CustomBar;
        let height = 0;
        uni.getSystemInfo({
          success: function (e) {
            height = e.screenHeight - CustomBar - 50;
          },
        });
        return height;
      },
      style() {
        return `padding-bottom:50px;height:${this.chatHeight}px;`;
      },
    },

    watch: {},

    onReady() {
      // 开启监听
    },

    async onLoad() {
      this.connectSocket();
      // 初始化聊天对象  自己 999 对方666
      this.myuid = 999;
      // 获取聊天记录
      this.getMsgList();
    },

    onUnload() {
      // 读取消息
    },

    async onShow() {},

    onHide() {
      // 读取消息
    },

    methods: {
      reachBottom(e) {
        console.log("触底：", e);
      },
      connectSocket() {
        // socket区域
        ws = uni.connectSocket({
          url: "ws://127.0.0.1:9001/websocket/123",
          protocols: ["token"],
          success() {},
        });
        ws.onOpen((data) => {
          console.log("连接成功", data);
        });
        ws.onMessage((res) => {
          console.log("收到服务端消息: ", res);
          let { data } = res;
          let _data = {
            id: "-1",
            showTime: false,
            time: new Date().getTime(),
            type: "text",
            userinfo: {
              uid: 666,
              username: this.username,
              face: this.avatar,
            },
            content: {
              url: "",
              text: data,
              w: "",
              h: "",
            },
          };
          this.screenMsg(_data, "get");
        });
        ws.onClose((data) => {
          console.log("连接关闭", data);
        });
      },
      // 时间格式化
      formatTime(time) {
        if (time) return Time.getDetailTime(Number(time));
      },

      // 接受消息(筛选处理)
      screenMsg(msg, receiveType) {
        switch (msg.type) {
          case "text":
            this.addTextMsg(msg, receiveType);
            break;
          case "img":
            this.addImgMsg(msg);
            break;
        }
        console.log("用户消息");
        //非自己的消息震动
        if (msg.userinfo.uid != this.myuid) {
          console.log("振动");
          // uni.vibrateLong();
        }
      },

      // 获取分页消息
      async getOffsetMsgList() {},

      //触发滑动到顶部(加载历史信息记录)
      async reachTop(e) {
        console.log("滚动到顶部");
        this.isBottom = false; // 页面不在最底部了
        if (this.showLoading) return;
        this.showLoading = true; //开启 loading 动画
        this.scrollAnimation = false; //关闭滑动动画
        let list = [
          {
            id: 2,
            showTime: false,
            time: new Date().getTime(),
            type: "text",
            userinfo: {
              uid: this.myuid,
              username: "尘落笔记",
              face: "",
            },
            content: {
              url: "",
              text: "111111111",
            },
          },
          {
            id: 3,
            showTime: false,
            time: new Date().getTime(),
            type: "text",
            userinfo: {
              uid: 666,
              username: "尘落笔记",
              face: "",
            },
            content: {
              url: "",
              text: "22222222222",
            },
          },
          {
            id: 4,
            showTime: false,
            time: new Date().getTime(),
            type: "text",
            userinfo: {
              uid: this.myuid,
              username: "尘落笔记",
              face: "",
            },
            content: {
              url: "",
              text: "111111111",
            },
          },
          {
            id: 5,
            showTime: false,
            time: new Date().getTime(),
            type: "text",
            userinfo: {
              uid: 666,
              username: "尘落笔记",
              face: "",
            },
            content: {
              url: "",
              text: "22222222222",
            },
          },
          {
            id: 6,
            showTime: false,
            time: new Date().getTime(),
            type: "text",
            userinfo: {
              uid: this.myuid,
              username: "尘落笔记",
              face: "",
            },
            content: {
              url: "",
              text: "111111111",
            },
          },
          {
            id: 7,
            showTime: false,
            time: new Date().getTime(),
            type: "text",
            userinfo: {
              uid: 666,
              username: "尘落笔记",
              face: "",
            },
            content: {
              url: "",
              text: "22222222222",
            },
          },
        ];
        this.msgList = [...this.msgList, ...list];
      },

      // 加载初始页面消息
      async getMsgList() {
        const list = [
          {
            id: 1,
            showTime: false,
            time: new Date().getTime(),
            type: "text",
            userinfo: {
              uid: this.myuid,
              username: "尘落笔记",
              face: "",
            },
            content: {
              url: "",
              text: "hello world",
            },
          },
        ];
        this.msgList = [...list, ...this.msgList];
      },

      //处理图片尺寸，如果不处理宽高，新进入页面加载图片时候会闪
      setPicSize(content) {
        // 让图片最长边等于设置的最大长度，短边等比例缩小，图片控件真实改变，区别于aspectFit方式。
        let maxW = uni.upx2px(350); //350是定义消息图片最大宽度
        let maxH = uni.upx2px(350); //350是定义消息图片最大高度
        if (content.w > maxW || content.h > maxH) {
          let scale = content.w / content.h;
          content.w = scale > 1 ? maxW : maxH * scale;
          content.h = scale > 1 ? maxW / scale : maxH;
        }
        return content;
      },

      //更多功能(点击+弹出)
      showMore() {
        if (this.hideMore) {
          this.hideMore = false;
          this.openDrawer();
          return;
        }
        this.hideDrawer();
      },
      // 打开抽屉
      openDrawer() {
        this.popupLayerClass = "showLayer";
      },
      // 隐藏抽屉
      hideDrawer() {
        this.popupLayerClass = "";
        setTimeout(() => {
          this.hideMore = true;
        }, 150);
      },
      // 选择图片发送
      chooseImage() {
        this.getImage("album");
      },
      //拍照发送
      camera() {
        this.getImage("camera");
      },

      //选照片 or 拍照
      getImage(type) {
        this.hideDrawer();
        uni.chooseImage({
          sourceType: [type],
          sizeType: ["original", "compressed"], //可以指定是原图还是压缩图，默认二者都有
          success: (res) => {
            uni.showLoading({
              title: "发送中...",
            });
            for (let i = 0; i < res.tempFilePaths.length; i++) {
              uni.getImageInfo({
                src: res.tempFilePaths[i],
                success: (image) => {
                  console.log(image.width);
                  console.log(image.height);
                },
              });
            }
          },
        });
      },

      //获取焦点，如果不是选表情ing,则关闭抽屉
      textareaFocus() {
        if (this.popupLayerClass == "showLayer" && this.hideMore == false) {
          this.hideDrawer();
        }
      },
      // 发送文字消息
      sendText() {
        this.hideDrawer(); //隐藏抽屉
        if (!this.textMsg) {
          return;
        }
        let msg = { text: this.textMsg };
        this.sendMsg(msg, "text");
        this.textMsg = ""; //清空输入框
      },

      // 发送消息
      async sendMsg(content, type) {
        //实际应用中，此处应该提交长连接，模板仅做本地处理。
        var nowDate = new Date().getTime();
        const userMsgList = this.msgList;
        const lastTime =
          userMsgList?.length > 0
            ? userMsgList[userMsgList.length - 1].time
            : 0;
        let lastid =
          userMsgList?.length > 0 ? userMsgList[userMsgList.length - 1].id : -1;
        lastid++;
        let msg = {
          id: lastid,
          showTime: Time.noFormatChatTime(nowDate, lastTime),
          time: nowDate,
          type: type,
          userinfo: {
            uid: this.myuid,
            username: this.username,
            face: this.avatar,
          },
          content: content,
        };
        // 发送消息
        this.screenMsg(msg);
      },
      scrollBottom() {
        if (this.scrollTop === 100) return;
        // 第一屏后不触发
        this.$nextTick(() => {
          const query = uni.createSelectorQuery().in(this);
          query
            .select("#mainArea")
            .boundingClientRect((data) => {
              if (data.height > +this.chatHeight) {
                this.scrollTop = 100;
              }
            })
            .exec();
        });
      },

      // 添加文字消息到列表
      addTextMsg(msg, receiveType) {
        this.msgList.unshift(msg);
        this.scrollBottom();
        if (receiveType === "get") return;
        // socket区域 发送文字
        ws.send({
          data: JSON.stringify({
            id: msg.userinfo.uid,
            text: msg.content.text,
            type: "chat",
          }),
          success() {
            // console.log('心跳发送成功！');
          },
        });
      },
      // 添加图片消息到列表
      addImgMsg(msg) {
        msg.content = this.setPicSize(msg.content);
        this.msgImgList.push(msg.content.url);
        this.msgList.push(msg);
      },
      addRedEnvelopeMsg(msg) {
        this.msgList.push(msg);
      },
      // 预览图片
      showPic(msg) {
        uni.previewImage({
          indicator: "none",
          current: msg.content.url,
          urls: this.msgImgList,
        });
      },
      discard() {
        return;
      },
    },
  };
</script>
<style lang="scss">
  @import "./style.scss";
  .mainArea {
    width: 100%;
    display: flex;
    flex-direction: column-reverse;
  }
</style>
