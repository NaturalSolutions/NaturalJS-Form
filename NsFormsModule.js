﻿define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'backbone_forms',
  'requirejs-text!./Templates/NsFormsModule.html',
], function ($, _, Backbone, Marionette, BackboneForm, tpl, Swal) {
    return Backbone.View.extend({
        BBForm: null,
        modelurl: null,
        Name: null,
        objecttype: null,
        displayMode: null,
        buttonRegion: null,
        formRegion: null,
        id: null,
        reloadAfterSave: true,
        template: tpl,
        regions: {
            nsFormButtonRegion: '#NsFormButton'
        },
        redirectAfterPost: "",

        initialize: function (options) {
            this.modelurl = options.modelurl;
            this.name = options.name;
            this.buttonRegion = options.buttonRegion;
            this.formRegion = options.formRegion;
            if (options.reloadAfterSave != null) { this.reloadAfterSave = options.reloadAfterSave };
            // The template need formname as vrairable, to make it work if several NSForms in the same page
            // With adding formname, there will be no name conflit on Button class
            var variables = { formname: this.name };
            if (options.template) {
                // if a specific template is given, we use it
                this.template = _.template($(options.template).html(), variables);
            }
            else {
                // else use defualt template
                this.template = _.template($(tpl).html(), variables);
            }


            if (options.id) {
                this.id = options.id;
            }
            else {
                this.id = 0;
            }
            if (options.displayMode) {
                this.displayMode = options.displayMode;
            }
            else {
                this.displayMode = 'edit';
            }
            if (options.objecttype) {
                this.objecttype = options.objecttype;
            }
            else {
                this.objecttype = null;
            }
            this.objecttype = options.objecttype;
            this.displaybuttons();
            if (options.model) {
                // If a model is given, no ajax call to initialize the form
                this.model = options.model;
                this.BBForm = new BackboneForm(this.model);
                this.showForm();
            }
            else {
                // otherwise, use ajax call to get form information
                this.initModel();
            }
            if (options.redirectAfterPost) {
                // allow to redirect after creation (post) using the id of created object
                this.redirectAfterPost = options.redirectAfterPost;
            }


        },

        initModel: function () {
            //initialize model from AJAX call
            this.model = new Backbone.Model();
            //console.log(this.model);
            var url = this.modelurl
            var ctx = this;
            url += this.id;

            $.ajax({
                url: url,
                context: this,
                type: 'GET',
                data: { FormName: this.name, ObjectType: this.objecttype, DisplayMode: this.displayMode },
                dataType: 'json',
                success: function (resp) {
                    ctx.model.schema = resp.schema;
                    ctx.model.attributes = resp.data;
                    if (resp.fieldsets) {
                        // if fieldset present in response, we get it
                        ctx.model.fieldsets = resp.fieldsets;
                    }
                    // give the url to model to manage save
                    ctx.model.urlRoot = this.modelurl;
                    ctx.BBForm = new BackboneForm({ model: ctx.model, data: ctx.model.data, fieldsets: ctx.model.fieldsets, schema: ctx.model.schema });
                    ctx.showForm();
                },
                error: function (data) {
                    //alert('error Getting Fields for Form ' + this.name + ' on type ' + this.objecttype);
                }
            });
        },
        showForm: function () {
            this.BBForm.render();
            // Call extendable function before the show call
            this.BeforeShow();
            var ctx = this;
            $('#' + this.formRegion).html(this.BBForm.el);

            this.buttonRegion.forEach(function (entry) {
                $('#' + entry).html(ctx.template);
            });



            this.displaybuttons();
        },



        displaybuttons: function () {
            var ctx = this;

            if (ctx.displayMode == 'edit') {
                $('.NsFormModuleCancel' + ctx.name).attr('style', 'display:');
                $('.NsFormModuleSave' + ctx.name).attr('style', 'display:');
                $('.NsFormModuleClear' + ctx.name).attr('style', 'display:');
                $('.NsFormModuleEdit' + ctx.name).attr('style', 'display:none');
                console.log($('#' + this.formRegion));
                $('#' + this.formRegion).find('input:enabled:first').focus()

            }
            else {
                $('.NsFormModuleCancel' + ctx.name).attr('style', 'display:none');
                $('.NsFormModuleSave' + ctx.name).attr('style', 'display:none');
                $('.NsFormModuleClear' + ctx.name).attr('style', 'display:none');
                $('.NsFormModuleEdit' + ctx.name).attr('style', 'display:');
            }


            $('.NsFormModuleSave' + ctx.name).click($.proxy(ctx.butClickSave, ctx));
            $('.NsFormModuleEdit' + ctx.name).click($.proxy(ctx.butClickEdit, ctx));
            $('.NsFormModuleClear' + ctx.name).click($.proxy(ctx.butClickClear, ctx));
            $('.NsFormModuleCancel' + ctx.name).click($.proxy(ctx.butClickCancel, ctx));
        },
        butClickSave: function (e) {
            this.BBForm.commit();

            if (this.model.attributes["id"] == 0) {
                // To force post when model.save()
                this.model.attributes["id"] = null;
            }

            var ctx = this;
            var _this = this;
            this.onSavingModel();
            if (this.model.id == 0) {
                // New Record
                this.model.save(null, {

                    success: function (model, response) {
                        // Getting ID of created record, from the model (has beeen affected during model.save in the response)
                        ctx.savingSuccess(model, response);
                        ctx.id = ctx.model.id;
                        
                        if (ctx.redirectAfterPost != "") {
                            // If redirect after creation
                            var TargetUrl = ctx.redirectAfterPost.replace('@id', ctx.id);

                            if (window.location.href == window.location.origin + TargetUrl) {
                                // if same page, relaod
                                window.location.reload();
                            }
                            else {
                                // otherwise redirect
                                window.location.href = TargetUrl;
                            }
                        }
                        else {
                            // If no redirect after creation
                            if (ctx.reloadAfterSave) {
                                ctx.reloadAfterSave();
                            }
                        }
                    },
                    error: function (response) {
                        _this.savingError(response);
                    }

                });
            }
            else {
                // UAfter update of existing record
                this.model.save(null, {
                    success: function (model, response) {
                        _this.savingSuccess(model, response);
                        console.log(model);
                        console.log(response);
                        if (ctx.reloadAfterSave) {
                            ctx.reloadingAfterSave();
                        }
                    },
                    error: function (response) {
                        _this.savingError(response);
                    }
                });
            }
            this.afterSavingModel();
        },
        butClickEdit: function (e) {
            e.preventDefault();
            this.displayMode = 'edit';
            this.initModel();
            this.displaybuttons();



        },
        butClickCancel: function (e) {
            e.preventDefault();
            this.displayMode = 'display';
            this.initModel();
            this.displaybuttons();
        },
        butClickClear: function (e) {
            var formContent = this.BBForm.el;
            $(formContent).find('input').val('');
            $(formContent).find('select').val('');
            $(formContent).find('textarea').val('');
            $(formContent).find('input[type="checkbox"]').attr('checked', false);
        },
        reloadingAfterSave: function () {
            this.displayMode = 'display';
            // reaload created record from AJAX Call
            this.initModel();
            this.showForm();
            this.displaybuttons();
        },
        onSavingModel: function () {
            // To be extended, calld after commit before save on model
        },
        
        afterSavingModel: function () {
            // To be extended called after model.save()
        },
        BeforeShow: function () {
            // to be extended called after render, before the show function
        },

        savingSuccess: function (model, response) {
            // To be extended, called after save on model if success
        },
        savingError: function (response) {
            // To be extended, called after save on model if error
        },
    });

});