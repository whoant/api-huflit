let request = require('request-promise');
const cheerio = require('cheerio');
const fs = require('fs');

const periodBoard = require('./periodBoard');

const API_SERVER = 'http://daotao.huflit.edu.vn';

class APIHuflit {
	constructor() {
		this.jar = request.jar();
		request = request.defaults({
			headers: {
				'Cache-Control': 'max-age=0',
				'Upgrade-Insecure-Requests': 1,
				'DNT': 1,
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
				'Accept-Language': 'en-US,en;q=0.9',
				'Content-Type': 'multipart/form-data',
				'Connection': 'keep-alive',
			}
		});
	}

	getMark() {
		return new Promise(async (resolve, reject) => {
			try {
				const $ = await this.requestServer({
					pathURI: '/Default.aspx?page=xemdiemthi',
					isTransform: true
				});
				resolve({
					'__VIEWSTATE': $('#__VIEWSTATE').val(),
					'__VIEWSTATEGENERATOR': $('#__VIEWSTATEGENERATOR').val()
				});
			} catch (error) {
				reject(error);
			}

		});
	}

	postMark({__VIEWSTATE, __VIEWSTATEGENERATOR}) {
		return new Promise(async(resolve, reject) => {
			try {
				const data = await this.requestServer({
					pathURI: '/Default.aspx?page=xemdiemthi',
					formData: {
						'__EVENTTARGET': 'ctl00$ContentPlaceHolder1$ctl00$lnkChangeview2',
						'__EVENTARGUMENT': '',
						__VIEWSTATE,
						__VIEWSTATEGENERATOR,
						'ctl00$ContentPlaceHolder1$ctl00$txtChonHK': ''
					},
					isTransform: true
				});
				resolve(data);

			} catch (error) {
				reject(error);
			}

		});
	}

	getAllMark() {
		const nameObjTemp = ['mediumScoreDec', 'mediumScoreGenFour', 'expMediumScore', 'expMediumScoreGenFour', 'achieveCredits', 'expCredits', 'classify'];

		return new Promise(async(resolve, reject) => {
			try {
				let data = await this.getMark();
				const $ = await this.postMark(data);
				let table = $('.view-table').children().children();
				
				let resuft = [];
				let count = -1;
				let countRowScore = 0;
	
				table.map(function () {
					let className = $(this).attr('class');
					switch (className) {

						case 'title-hk-diem':
							resuft.push({
								semester: $(this).children().children().text(),
								score: [],
								mediumScoreDec: '',
								mediumScoreGenFour: '',
								expMediumScore: '',
								expMediumScoreGenFour: '',
								achieveCredits: '',
								expCredits: '',
								classify: ''
                            });
                            
							countRowScore = 0;
                            count++;
                            
                            break;
                            
						case 'row-diem':
							let temp = [];
							let obj = {};
	
							$(this).children().map(function () {
								temp.push($(this).children().text().trim());
							});
	
							[obj.stt, obj.id, obj.nameSubject, obj.credits, obj.percentTest, obj.percentExam, obj.dilegenceScore, obj.processScore, obj.firstExam, obj.secondExam, obj.finalScoreNumber, obj.finalScoreWord] = temp;
							delete obj.stt;
							resuft[count].score.push(obj);
	
                            break;
                            
						case 'row-diemTK':
							resuft[count][nameObjTemp[countRowScore]] = $(this).children().children().next().text().trim();
							countRowScore++;
							break;
					}
	
				});
				
				resolve(resuft);
				 
			} catch (error) {
				reject(error);
			}
		});
	}

	getSchedule(idStudent) {
		return new Promise(async (resolve, reject) => {
			try {
				let schedule = [];
				const $ = await this.requestServer({
					pathURI: '/default.aspx?page=thoikhoabieu&sta=0&id=' + idStudent,
					isTransform: true
				});
				let parentTable = $('.textTable').parent();

				let contentStudent = $('#ctl00_ContentPlaceHolder1_ctl00_lblContentTenSV').text().split('-');
				let classStudent = $('#ctl00_ContentPlaceHolder1_ctl00_lblContentLopSV').text().split('-');
				
				parentTable.map(items => {
                    let item = parentTable[items].attribs.onmouseover.split(',');

                    let startPeriod = parseInt(item[6].slice(0, -1).slice(1));
					let numberOfPeriods = parseInt(item[7].slice(0, -1).slice(1));

				
					schedule.push({
                        nameSubject: item[1].slice(0, -1).slice(1),
                        codeSubject: item[2].slice(0, -1).slice(1),
						dayOfWeek: item[3].slice(0, -1).slice(1),
                        room: item[5].slice(0, -1).slice(1),
                        nameTeacher: item[8].slice(0, -1).slice(1),
                        timeStart: periodBoard[startPeriod].start,
                        timeStop: periodBoard[startPeriod + numberOfPeriods - 1].end,
					});
				});

				resolve({
					name: contentStudent[0].trim(),
					birthday: contentStudent[1].split(':')[1],
					class: classStudent[0].trim(),
					majors: classStudent[1].split(':')[1].trim(),
					specialty: classStudent[2].split(':')[1].trim(),
					schedules: schedule
				});

			} catch (error) {
				reject(error);
			}
		});
	}

	getTestSchedule() {
		return new Promise(async (resolve, reject) => {
			let resuft = [];

			try {
				const $ = await this.requestServer({
					pathURI: '/default.aspx?page=xemlichthi',
					isTransform: true
				});

				let table = $('#ctl00_ContentPlaceHolder1_ctl00_gvXem').children().children();

				table.map((index, element) => {
					if (index !== 0) {
						let temp = [];
						let obj = {};

						$(element).children().children().map(function () {
							temp.push($(this).text().trim());
						});

						[obj.stt, obj.code, obj.nameSubject, obj.ghepthi, obj.count, obj.testDay, obj.startTime, obj.numberOfMinutes, obj.room, obj.note] = temp;
						resuft.push(obj);
					}
				});

				resolve(resuft);

			} catch (error) {
				reject(error);
			}

		});
	}

	login({ user, pass }) {

		return new Promise(async (resolve, reject) => {
			try {
				const $ = await this.requestServer({
					pathURI: '/default.aspx',
					formData: {
						'__EVENTTARGET': '',
						'__EVENTARGUMENT': '',
						'ctl00$ContentPlaceHolder1$ctl00$ucDangNhap$txtTaiKhoa': user,
						'ctl00$ContentPlaceHolder1$ctl00$ucDangNhap$txtMatKhau': pass,
						'ctl00$ContentPlaceHolder1$ctl00$ucDangNhap$btnDangNhap': 'Đăng Nhập',
					},
					isTransform: true
				});
			
				let name = $('#ctl00_Header1_ucLogout_lblNguoiDung').text();
				if (name.length) resolve(this.jar)
				reject('Forgot user or pass');

			} catch (error) {
				reject(error);
			}
		});

	}

	requestServer(data = { pathURI, formData: '', isTransform: false }) {

		let form = {
			uri: API_SERVER + data.pathURI,
			jar: this.jar,
			method: (typeof data.formData === 'object') ? 'post' : 'get',
			formData: data.formData
		};

		if (data.isTransform) form.transform = body => cheerio.load(body);
		return request(form);
	}

}


module.exports = APIHuflit;