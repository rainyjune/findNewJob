/* GET home page. */
var 
  rest = require('../fetch.js'),
  jsdom = require('jsdom'),
  fs = require('fs');
  html = '<html><body><h1>Hello World!</h1><p class="hello">Heya Big World!</body></html>';

exports.index = function(req, res){
  var env = jsdom.env;
  var keywordEntries = [];
  var jobTitleFilterString = fs.readFileSync('./jobTitleBad.txt', {encoding:'utf8'});
  var jobTitleFilterExp = new RegExp(jobTitleFilterString.split(/\n/).join('|'), "i");
  var companyFilterString = fs.readFileSync('./companyBadNames.txt', {encoding:'utf8'});
  var companyFilterExp = new RegExp(companyFilterString.split(/\n/).join('|'), "i");
  var addressFilterExp = /石景山区|大兴区/;

  var entriesString = fs.readFileSync('./entryUrls.txt', {encoding:'utf8'}).trim();
  
  keywordEntries = entriesString.split(/\n/);
  console.log('entriesString length', keywordEntries.length);
  
  domEnv(function($) {
    var dataArr = [];
    
    var listPromises = [];
    
    var kwEntriesDone = 0;
    
    for (var i = 0, l = keywordEntries.length; i < l; i++) {
      var thisPromise = fetchListData(keywordEntries[i]).always(function(){
        kwEntriesDone++;
        //console.log('dataarr leng', dataArr.length);
        if (kwEntriesDone == keywordEntries.length) {
          testFunc();
        }
      });
      listPromises = listPromises.concat(thisPromise);
    }
    
    var obj = {};
    
    $.whenall(listPromises);
    
    function testFunc() {
      // Filter
      var newdataArr = dataArr.filter(filterResult);
      // Next filter
      var newResult = [];
      var detailPromises = [];
      var doneCount = 0;
      var promiseLen = newdataArr.length; 
      newdataArr.forEach(function(element, index, array) {
        var urlArr = element.jobUrl.split('/'),
        options = {
            host: urlArr[2],
            path: '/' + urlArr[3], 
            port: 80,
            method: 'GET'
        };
        var thisPromise = fetchJobData(options).then(function(data){
          // filter again 
          if (data.companyType == '国企') {
          } else if (data.hirecount == '若干') {
          } else if (data.salary != '面议' && data.salary.split(/\-|元\/月/)[1] <= 15000) {
          } else if (data.jobType == '网页设计/制作/美工') {
          } else {
            newResult = newResult.concat(element); 
          }
        }).always(function(){
          doneCount++;
          console.log(doneCount + '/' + promiseLen);
          console.log('Progress:', doneCount/promiseLen * 100 + '%');
          if (doneCount == promiseLen) {
            console.log('[DONE!!!]newResult',newResult); 
            res.render('index', { title: 'Express', data: newResult, num: newResult.length });
          }
        });         
        detailPromises = detailPromises.concat(thisPromise); 
      });
      $.whenall(detailPromises);
    }
    
    function fetchPageData(option) {
      var d = $.Deferred();
      rest.getHTML(option, function(statusCode, result) {
        if (statusCode == 200) {
          env(result, function(errors, window) {
            var $ = require('jquery')(window);
            //$.whenall = function(arr) { return $.when.apply($, arr); };
            var items = $(".search-result-tab");
            items.each(function(){
              var obj = {};
              var item = $(this);
              
              var jobTitleLink = item.find('.Jobname').find('a');
              obj.jobTitle = jobTitleLink.text().trim();
              obj.jobUrl = jobTitleLink.attr('href');
              var companyLink = item.find('.Companyname').find('a');
              obj.company = companyLink.text().trim();
              obj.companyUrl = companyLink.attr('href');
              obj.address = item.find('.Companyaddress').text().trim();
              obj.releaseTime = item.find('.releasetime').text().trim();
              
              var subContainer = item.find('.search-result-infotab').find('.tabCol1');
              obj.companyType = subContainer.find('span').eq(1).text().split('：').pop().trim();
              obj.companySize = subContainer.find('span').eq(2).text().split('：').pop().trim();
              obj.jobEducation = subContainer.find('span').eq(3).text().split('：').pop().trim();
              dataArr.push(obj);
              
            });
            d.resolve(result);
          });
        } else {
          d.reject(result);
        }
      });
      return d.promise();
    }
    
    function fetchListData(option) {
      var d = $.Deferred();
      rest.getHTML(option, function(statusCode, result) {
        if (statusCode == 200) {
          env(result, function(errors, window) {
            var $ = require('jquery')(window);
            $.whenall = function(arr) { return $.when.apply($, arr); };
            var pageLinks = $('div.pagesDown a[href]').filter(function(){return !isNaN($(this).text());});
            if (pageLinks.length) {
              var pagePromises = [];
              var pageDoneCount = 0;
              pageLinks.each(function(){
                var listURL = $(this).attr('href');
                if (listURL == '#') {
                  listURL = option;
                }
                var pagePromise = fetchPageData(listURL).always(function(){
                  pageDoneCount++
                  if (pageDoneCount == pagePromises.length) {
                    d.resolve(result);
                  }
                });
                pagePromises = pagePromises.concat(pagePromise);
              });
              $.whenall(pagePromises);
            } else {
              d.resolve(result);
            }
          });
        } else {
          d.reject(result);
        }
      });
      return d.promise();
    }

    function fetchJobData(option) {
      var d = $.Deferred();
      rest.getHTML(option, function(statusCode, result) {
        if (statusCode == 200) {
          env(result, function(errors, window) {
            try {
              console.log("url:", option.host+option.path, ' ERROR:', errors);
              var $ = require('jquery')(window);
              var container = $("div.terminalpage-left");
              var topCon = container.find('div.terminalpage-left-top');
              var topConTop = topCon.find('.terminalpage-table').eq(0);
              var topConMain = topCon.find('.terminalpage-table').eq(1);
              var mainCon = container.find('div.terminalpage-main').eq(0); 
              var topConTopTDs =  topConTop.find('td');
              var topConMainTDs =  topConMain.find('td');
                var obj = {};

                obj.companyType = topConTopTDs.eq(5).text().trim();
                obj.companyHangye = topConTopTDs.eq(7).text().trim();
                
                obj.workDuration = topConMainTDs.eq(1).text().trim(); 
                obj.education = topConMainTDs.eq(5).text().trim(); 
                obj.manageExp = topConMainTDs.eq(7).text().trim(); 
                obj.salary = topConMainTDs.eq(9).text().trim(); 
                obj.hirecount = topConMainTDs.eq(11).text().trim(); 
                obj.jobType = topConMainTDs.eq(15).text().trim(); 
                
              d.resolve(obj);
            } catch (err) {
              d.reject(err);
            }
          });
        } else {
          d.reject(result);
        }
      });
      return d.promise();
    }
    
    function filterResult(element) {
      var jobUrl = element['jobUrl'];
      var jobTitle = element['jobTitle'];
      var companyName = element['company'];
      var address = element['address'];
      if ( jobUrl in obj) {
        return false;
      } else if (jobTitle.search(jobTitleFilterExp) != -1) {
        return false;
      } else if(companyName.search(companyFilterExp) != -1) {
        return false;
      } else if (address.search(addressFilterExp) != -1) {
        return false;
      }else {
        obj[jobUrl] = true;
        return true;
      }
    }
  });
  
  function domEnv(callback) {
    env(html, function(errors, window) {
      var $ = require('jquery')(window);
      $.whenall = function(arr) { return $.when.apply($, arr); };
      callback($);
    });
  }
};
