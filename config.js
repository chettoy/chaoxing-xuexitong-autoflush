import fs from "fs";

class Config {
	constructor(path) {
		this.path = path;
		this.uname = null;
		this.password = null;
		this.speed = null;
		this.pick = null;
		this.test = null;
		// 没啥用,主要是考虑到帐号切换和逻辑问题
		this.saveCookie = null;
		this.pickinfos = null;
	}

	async write() {
		const c = {
			uname: this.uname,
			password: this.password,
			speed: this.speed,
			test: this.test,
			pick: this.pick,
			pickinfos: this.pickinfos,
			saveCookit: this.saveCookie,
		};

		const config = JSON.stringify(c, null, "\t");
		return await fs.promises.writeFile(this.path, config, {
			encoding: "utf8",
		});
	}

	async read(path) {
		const config = {
			speed: 2,
			pick: false,
			test: true,
		};
		return await fs.promises
			.readFile(this.path, {
				encoding: "utf8",
			})
			.then((c) => {
				try {
					Object.assign(config, JSON.parse(c));
					for (const key in config) this[key] = config[key];
					return this;
				} catch (e) {
					console.error(e);
					process.exit(0);
				}
			})
			.catch((e) => {
				// console.error(e);
				console.log("读取失败或者目录下不存在配置文件");
				return this;
			});
	}
}

export default Config;
