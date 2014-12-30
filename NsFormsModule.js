define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'backboneforms',
  'text!Modules/Templates/NsFormsModule.html'
], function ($, _, Backbone, Marionette, BackboneForm, TplForm) {
    return Marionette.ItemView.extend({
        BBForm: null,
        modelurl: null,
        Name: null,
        objecttype: null,
        displayMode: null,
        buttonRegion: null,
        formRegion: null,
        isNew: null,
        id: null,
        template: TplForm,
        regions: {
            nsFormButtonRegion: '#NsFormButton'
        },
        
       

        initialize: function (options) {

            //TODO Gestion Fields/Get à partir de la même url            
            this.modelurl = options.modelurl;
            this.name = options.name;
            this.buttonRegion = options.buttonRegion;
            this.formRegion = options.formRegion;
            if (options.id) {
                this.id = options.id;
                this.isNew = false;
            }
            else {
                this.id = null;
                this.isNew = true;
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
                this.model = options.model;
                this.BBForm = new BackboneForm({ model: this.model });
            }
            else {
                this.initModel();
            }



        },

        initModel: function () {
            //Initialisation du model et sema depuis l'url


            this.model = new Backbone.Model();
            console.log(this.model);
            var url = this.modelurl
            if (!this.isNew) {
                url += this.id;
            }
            else {
                url += '0';
            }
             
            $.ajax({
                url: url,
                context: this,
                type: 'GET',
                data: { FormName: this.name, ObjectType: this.objecttype,DisplayMode:this.displayMode },
                dataType: 'json',
                success: function (resp) {
                    console.log(this);
                    this.model.schema = resp.schema;
                    this.model.attributes = resp.data;
                    if (resp.fieldsets) {
                        this.model.fieldsets = resp.fieldsets;
                    }
                    this.model.url = this.modelurl;
                    console.log(this.BBForm);
                    //this.model.trigger('change');
                    this.showForm();
                },
                error: function (data) {
                    alert('error Getting Fields for Form ' + this.name + ' on type ' + this.objecttype);
                }
            });
        },
        showForm: function () {
            this.BBForm = new BackboneForm({ model: this.model });
            this.BBForm.render();
            $('#' + this.formRegion).html(this.BBForm.el);
            $('#' + this.buttonRegion).html(this.template);
            this.displaybuttons();
        },


        /*
        gethtml: function () {
            this.BBForm = new BackboneForm({ model: this.model });
            this.BBForm.render();
            var formContent = this.BBForm.el;
            //this.displaybuttons();
            return formContent;
        },

        getbuttonhtml: function () {
            this.displaybuttons();
            console.log(this.template);
            return this.template;
        },

        */
        displaybuttons: function () {
            if (this.displayMode == 'edit') {
                $('#' + this.buttonRegion).find('#NsFormModuleSave').attr('style', 'display:');
                $('#' + this.buttonRegion).find('#NsFormModuleClear').attr('style', 'display:');
                $('#' + this.buttonRegion).find('#NsFormModuleEdit').attr('style', 'display:none');
            }
            else {
                $('#' + this.buttonRegion).find('#NsFormModuleSave').attr('style', 'display:none');
                $('#' + this.buttonRegion).find('#NsFormModuleClear').attr('style', 'display:none');
                $('#' + this.buttonRegion).find('#NsFormModuleEdit').attr('style', 'display:');
            }
            
           // $('#' + this.buttonRegion).on('click #NsFormModuleSave', this.butClickSave);
            $('#NsFormModuleSave').click($.proxy(this.butClickSave, this));
            $('#NsFormModuleEdit').click($.proxy(this.butClickEdit, this));
            $('#NsFormModuleClear').click($.proxy(this.butClickClear, this));
           
        },
        butClickSave: function (e) {
            //e.preventDefault();
            // TODO gérer l'appel AJAX
            this.BBForm.commit();
            console.log(this.model);
            this.model.set('id', null);
            this.model.save();
            
            this.displayMode = 'display';
            this.displaybuttons();
            
        },
        butClickEdit: function (e) {
            e.preventDefault();
            this.displayMode = 'edit';
            this.initModel();
        },

        butClickClear: function (e) {
            this.displaybuttons();
            //this.displayMode = 'edit';
            //initModel();
            // TODO gérer l'appel AJAX

        },
       

    });

});