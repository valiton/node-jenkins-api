var util     = require('util')
    ,qs      = require('querystring')
    ,request = require('request')
    , _      = require('lodash');

API = '/api/json';
NEWJOB = '%s/createItem/?name=%s';
DELETE = '%s/job/%s/doDelete';
BUILD = '%s/job/%s/build';
BUILDWITHPARAMS = '%s/job/%s/buildWithParameters';
CONFIG = '%s/job/%s/config.xml';
JOBINFO = '%s/job/%s' + API;
LIST = '%s' + API;
LAST_SUCCESS = '%s/job/%s/lastSuccessfulBuild' + API;
TEST_REPORT = '%s/job/%s/lastSuccessfulBuild/testReport' + API;
LAST_BUILD = '%s/job/%s/lastBuild' + API;
LAST_COMPLETED_BUILD = '%s/job/%s/lastCompletedBuild' + API;
BUILD = '%s/job/%s/%s' + API;
LAST_REPORT = '%s/job/%s/lastBuild/testReport' + API;
VIEW = '%s/view/%s/api/xml';
ADD_JOB_TO_VIEW = '%s/view/%s/addJobToView?name=%s'

var init = exports.init = function(host, options) {

    //Jenkin variables
    var host = host;

    // request options
    options = options || {};

    //Helper Functions
    var build_url = function() {
      var args = Array.prototype.slice.call(arguments);
      return util.format.apply(this, [args.shift(), host].concat(args));
    };


    return {
        build: function(jobname, callback, params) {
            /*
            Trigger Jenkins to build.
            */
            if (!params) {
                request(_.extend(options, {method: 'POST', url: build_url(BUILD, jobname)}), function(error, response, body) {
                });
            }else {
                request(_.extend(options, {method: 'POST', url: build_url(BUILDWITHPARAMS+"?"+qs.stringify(params), jobname)}), function(error, response, body) {
                });
            }

        },
        all_jobs: function(callback) {
            /*
            Return a list of object literals containing the name and color of all jobs on the Jenkins server
            */
            request(_.extend(options, {method: 'GET', url: build_url(LIST)}), function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body.toString()).jobs;
                callback(null, data);
            });
        },
        job_info: function(jobname, callback) {
            /*
            Get all information for a job
            */
            request(_.extend(options, {method: 'GET', url: build_url(JOBINFO, jobname)}), function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body.toString());
                callback(null, data);
            });
        },
        last_build_info: function(jobname, callback) {
            /*
            Get information for the last build of a job
            */
            request(_.extend(options, {method: 'GET', url: build_url(LAST_BUILD, jobname)}), function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body.toString());
                callback(null, data);
            });
        },
        last_completed_build_info: function(jobname, callback) {
            /*
            Get information for the last completed build of a job
            */
            request(_.extend(options, {method: 'GET', url: build_url(LAST_COMPLETED_BUILD, jobname)}), function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body.toString());
                callback(null, data);
            });
        },
        build_info: function(jobname, number, callback) {
            /*
            Get information for the build number of a job
            */
            request(_.extend(options, {method: 'GET', url: build_url(BUILD, jobname, number)}), function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body.toString());
                callback(null, data);
            });
        },
        last_build_report: function(jobname, callback) {
            /*
            Get the last build report for a job
            */
            request(_.extend(options, {method: 'GET', url: build_url(LAST_REPORT, jobname)}), function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body.toString());
                callback(null, data);
            });
        },
        get_view: function(viewname, callback) {
            /*
            Get the last build report for a job
            */
            request(_.extend(options, {method: 'GET', url: build_url(VIEW, viewname)}), function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                callback(null, body);
            });
        },
        add_job_to_view: function(viewname, jobname, callback) {
            /*
            Get the last build report for a job
            */
            request(_.extend(options, {
              method: 'POST',
              url: build_url(ADD_JOB_TO_VIEW, viewname, jobname)
            }), function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                callback(null, body);
            });
        },
        get_config_xml: function(jobname, callback) {
            /*
            Get the config xml for a job
            */
            request(_.extend(options, {method: 'GET', url: build_url(CONFIG, jobname)}), function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = body;
                callback(null, data);
            });
        },
        create_job: function(jobname, job_config, callback) {
            /*
           Create a new job based on a job_config string
            */

            request(_.extend(options,
                {method: 'POST'
                ,url: build_url(NEWJOB, jobname)
                ,body: job_config
                ,headers: {"content-type": "application/xml"}
                }),

                function(error, response, body) {

                    if ( error || response.statusCode !== 200 ) {
                        callback(error || response.statusCode, response);
                        return;
                    }
                    data = body;
                    callback(null, data);
                }
            );
        },
        copy_job: function(jobname, new_job, modifyfunction, callback) {
            /*
            Copies a job and allows you to pass in a function to modify the configuration
            of the job you would like to copy
            */

            var self = this;
            self.get_config_xml(jobname, function(error, data) {
                if (error) {
                    callback(error, data);
                    return;
                }
                self.create_job(new_job, modifyfunction(data), function(error, data) {
                    if (error) {
                        callback(error, data);
                        return;
                    }
                    callback(null, data);
                });
            });

        },
        delete_job: function(jobname, callback) {
            /*
            Deletes a job
            */
            request(_.extend(options, {method: 'POST', url: build_url(DELETE, jobname)}), function(error, response, body) {
                if ( error || response.statusCode === 404 ) {
                    callback(error || true, response);
                    return;
                }
                callback(null, body);
            });

        },
        last_success: function(jobname, callback) {
            /*
            Get the last build report for a job
            */
            request(_.extend(options, {method: 'POST', url: build_url(LAST_SUCCESS, jobname)}), function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                    callback(error || true, response);
                    return;
                }
                data = JSON.parse(body);
                callback(null, data);
            });

        },
        last_result: function(jobname, callback) {
            /*
            Get the last result for a job
            */
            self = this;
            self.job_info(jobname, function(error, data) {
                last_result_url = data['lastBuild']['url'];

                request(_.extend(options, {method: 'GET', url: build_url(last_result_url + API, jobname)}), function(error, response, body) {
                if ( error || response.statusCode !== 200 ) {
                        callback(error || true, response);
                        return;
                    }
                    data = JSON.parse(body);
                    callback(null, data);
                });
            });

        },

    }

}

if (!module.parent) {
}
