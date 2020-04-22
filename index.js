const request = require('request');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const URL = "https://vnexpress.net/";
let arrayData = []
const pushNew = (title, body, link) => {
  arrayData.push({
    title, body, link
  })
}
function doRequest(url) {
  return new Promise(function (resolve, reject) {
    request(url, function (error, res, body) {
      if (!error && res.statusCode == 200) {
        resolve(body);
      } else {
        reject(error);
      }
    });
  });
}

const scrapData = async (context) => {
  context('p.description>a').each(function () {
    const link = context(this).attr('href');
    const title = context(this).attr('title')
    const body = context(this).text()
    pushNew(title, body, link)
  })
}

const getMetaContent = async () => {
  for (let i = 0; i < arrayData.length; i++) {
    const body = await doRequest(arrayData[i].link);
    let $ = cheerio.load(body, 500)
    const time = $('div.container>div.sidebar-1>div.header-content>span.date').text()
    const authors = $('div.container>div.sidebar-1>article.fck_detail>p')
    authors.each(function (index) {
      if (index === authors.length - 1) {
        const author = $(this).find('strong').text()
        arrayData[i].author = author
      }
    })
    arrayData[i].time = time
  }
}

const main = async () => {
  const body = await doRequest(URL);
  let $ = cheerio.load(body, 5000);
  scrapData($)
  await getMetaContent()
  const csvWriter = createCsvWriter({
    path: "./output/scrap.csv",
    header: [
      { id: "url", title: "URL" },
      { id: "title", title: "Title" },
      { id: "author", title: "Author" },
      { id: "date", title: "Date" }
    ]
  });
  const data = arrayData.map(item => ({
    url: item.link,
    title: item.title,
    author: item.author,
    date: item.time
  }))
  csvWriter.writeRecords(data)
}

main()