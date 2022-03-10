import fs from "fs";
import prompt from "prompts";
import Net from "./net.js";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

class Loginer {
  //登录器
  constructor(config) {
    // 这里登陆接口更换
    // 快速登陆早就废了,而且验证码也是来自下面这个域名,就这么改了
    this.net = new Net("https://passport2-api.chaoxing.com/");
    this.imgurl = __dirname + "/verifycode.jpg";
    this.config = config;
    //	this.login();
  }

  async login(acc = {}) {
    //设置各种引导,最终返回登录Cookie
    /*
        while(true){
            let acc={};
            acc=await prompt([
                    {type:"text",name:"uname",message:"请输入超星账户手机号"},
                    {type:"text",name:"password",message:"请输入账户密码"},
                ])
                if(!acc.uname || !acc.password)//填空代表退出登录
                    throw "输入为空,退出程序"

            let vercode=await this.getNumcode();
            try{
            await this.doLogin(acc.uname,acc.password,vercode);
            break;
            }catch(e){
            console.log(`登录失败: ${e},请重试!\n\n`);

            }
        }
        */

    if (!acc.uname || !acc.password) {
      console.log("配置文件中账号或密码未填写,请手动输入");
      Object.assign(
        acc,
        await prompt([
          { type: "text", name: "uname", message: "请输入超星账户手机号" },
          { type: "text", name: "password", message: "请输入账户密码" },
        ])
      );
    }
    if (!acc.uname || !acc.password)
      //填空代表退出登录

      throw "输入为空,退出程序";

    const res = await this.doFastLogin(acc.uname, acc.password);
    if (res !== true) {
      console.log("快速登录失败，已回退");
      let vercode = await this.getNumcode();
      await this.doLogin(acc.uname, acc.password, vercode);
      // process.exit(0);
    }
    //这里处理Cookie，保留重要的部分
    let vc3spliter = {
      start: 0,
      end: 0,
      vc3: "",
    };

    let ck = await this.net.getCookies();

    vc3spliter.start = ck.indexOf(", vc3=");
    vc3spliter.end = ck.indexOf(";", vc3spliter.start + 1);
    vc3spliter.vc3 = ck.substring(
      vc3spliter.start + ", vc3=".length,
      vc3spliter.end
    );

    let uidspliter = {
      start: 0,
      end: 0,
      uid: "",
    };

    uidspliter.start = ck.indexOf(", _uid=");
    uidspliter.end = ck.indexOf(";", uidspliter.start + 1);
    uidspliter.uid = ck.substring(
      uidspliter.start + ", _uid=".length,
      uidspliter.end
    );

    let dspliter = {
      start: 0,
      end: 0,
      d: "",
    };

    dspliter.start = ck.indexOf(", _d=");
    dspliter.end = ck.indexOf(";", dspliter.start + 1);
    dspliter.d = ck.substring(dspliter.start + ", _d=".length, dspliter.end);

    let vc3 = vc3spliter.vc3;
    let uid = uidspliter.uid;
    let d = dspliter.d;

    return `vc3=${vc3}; _uid=${uid}; _d=${d}; `;
  }

  async getNumcode() {
    let img = await this.net.getBin("num/code", true);
    fs.writeFileSync(this.imgurl, img);
    // open(this.imgurl, { wait: true }).catch((e) => {
    // 	console.log("尝试打开验证码图片失败,请手动打开.\n");
    // }).then(() => {
    // 	//	console.log("验证码窗口已关闭");
    // });

    console.log("\n(提示:若你不是win系统,可以打开目录下的verifycode.jpg)");
    let ret = await prompt({
      type: "text",
      name: "vercode",
      message: "已弹出验证码,请在这输入验证码",
    });
    return ret["vercode"];
  }

  async doFastLogin(uname, password) {
    let net = new Net("https://passport2.chaoxing.com/")
    let info = await net.post(
      `fanyalogin`, {
      'fid': -1,
      'uname': uname,
      'password': Buffer.from(password, 'utf8').toString('base64'),
      'refer': "http%3A%2F%2Fi.chaoxing.com",
      't': true,
      'forbidotherlogin': 0
    },
      true
    );

    try {
      info = JSON.parse(info);
      if (!info.status) {
        if (info.msg2) {
          let msg = info.msg2;
          msg = ("密码错误" == msg || "用户名或密码错误" == msg) ? "手机号或密码错误" : msg;
          console.log(msg);
          process.exit(0);
        }
        return info;
      }

      this.net.jar = net.jar;

      let ck = await this.net.getCookies();
      return true;
    } catch (e) {
      // console.log(info);
      return { success: false, errorMsg: "API返回了错误的值" };
    }
  }

  async doLogin(uname, password, numcode) {
    //返回成功或失败
    //cookie中有三个关键值特别重要
    //_uid、_d、vc3

    let info = await this.net.post(
      "cxlogin?refer=http%3A%2F%2Fi.mooc.chaoxing.com",
      {
        refer_0x001: "http%3A%2F%2Fi.mooc.chaoxing.com",
        pid: -1,
        pidName: "",
        fid: 9136,
        fidName: "超星个人网",
        allowJoin: 1,
        isCheckNumCode: 1,
        f: 0,
        uname,
        password,
        numcode,
      },
      true
    );
    let ck = await this.net.getCookies();
    //console.log(ck,info);
    //		console.log(ck,uid,d,vc3);
    if (ck.indexOf("userinfo") != -1) {
      return;
    } else {
      // 不需要这些,也没有任何影响
      // let $ = cheerio.load(info);
      // let error = $("#show_error").text();
      // console.log("error",error);
      // throw error;
      return;
    }
  }
}

export default Loginer;
