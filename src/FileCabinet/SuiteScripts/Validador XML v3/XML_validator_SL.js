/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
 define(['N/log', 'N/ui/serverWidget', 'N/runtime', 'N/search', 'N/http', 'N/xml', 'N/encode', 'N/file', 'N/record', 'N/format', 'N/redirect', 'N/config', 'N/https'],
 function (log, ui, runtime, search, http, xml, encode, file, record, format, redirect, config, https) {



    var assistant,
        preId = 'custpage_pre',
        firstId = 'custpage_files',
        secondId = 'custpage_validating',
        thirdId = 'custpage_finish',
        finishStep = false,
        expenseReportId = 0,
        params,
        request,
        response,
        paramAmount = null,
        paramCredit = null,
        paramNotes = '',
        paramPDf = null,
        paramXML = null,
        paramCurrency = 0,
        paramPreviousStep = '',
        paramHasInvoice = null,
        paramFinished = null,
        paramSubsidiary = 0,
        paramExpense = 0,
        paramCategory = 0,
        paramCustomer = null,
        xmlFile = null,
        customFieldsValues = {},
        generalErrors = '';

     function onRequest(context) {
         var form = null;
         try {
            params = context.request.parameters,
            request = context.request,
            response = context.response;
            log.audit({ title: 'onRequest - params', details: params });
            paramPreviousStep = params.custparam_step || '';
            log.audit({ title: 'onRequest - paramPreviousStep', details: paramPreviousStep });
            paramCredit = params.custpage_credit_card || 'F';
            log.audit({ title: 'onRequest - paramCredit', details: paramCredit });
            paramNotes = params.custpage_notes || '';
            log.audit({ title: 'onRequest - paramNotes', details: paramNotes });
            expenseReportId = params.er || 0;
            log.audit({ title: 'onRequest - expenseReportId', details: expenseReportId });
            paramCurrency = params.custpage_currency || 0;
            log.audit({ title: 'onRequest - paramCurrency', details: paramCurrency });
            paramSubsidiary = params.custpage_subsidiary || 0;
            log.audit({ title: 'onRequest - paramSubsidiary', details: paramSubsidiary });
            paramHasInvoice = params.custpage_deductible || 'F';
            log.audit({ title: 'onRequest - paramHasInvoice', details: paramHasInvoice });
            paramAmount = params.custpage_amount || 0;
            log.audit({ title: 'onRequest - paramAmount', details: paramAmount });
            paramCustomer = params.custpage_client || 0;
            log.audit({ title: 'onRequest - paramCustomer', details: paramCustomer });

            if (paramPreviousStep == firstId) {
                paramPDf = request.files.custpage_pdf || null;
            }else {
                paramPDf = params.custpage_pdf || null;
            }
            log.audit({ title: 'onRequest - paramPDf', details: paramPDf });
            paramFinished = params.custpage_finished || 'F';
            log.audit({ title: 'onRequest - paramFinished', details: paramFinished });
            paramExpense = params.custpage_expense_report || 0;
            log.audit({ title: 'onRequest - paramExpense', details: paramExpense });
            paramCategory = params.custpage_pay_method || 0;
            log.audit({ title: 'onRequest - paramCategory', details: paramCategory });
            if (paramPDf && params.custparam_step == firstId) {
                log.audit({ title: 'onRequest', details: 'Uploading file ' + paramPDf.name });
                var jsonPDf = fileUpload(paramPDf, 1);

                paramPDf = JSON.stringify(jsonPDf);
            }
            if (paramPreviousStep == firstId) {
                log.audit({ title: 'request.files.custpage_xml', details: request.files.custpage_xml });
                paramXML = request.files.custpage_xml || null;
            }else {
                log.audit({ title: 'params.custpage_xml', details: params.custpage_xml });
                paramXML = params.custpage_xml || null;
            }
            log.audit({ title: 'onRequest - paramXML', details: paramXML });

            if (paramXML && params.custparam_step == firstId) {
                log.audit({ title: 'onRequest', details: 'Uploading file ' + paramXML.name });
                var jsonXML = fileUpload(paramXML);
                paramXML = JSON.stringify(jsonXML, 2);
            }
            log.audit({ title: 'onRequest', details: 'paramHasInvoice: ' + paramHasInvoice });
            log.audit({ title: 'onRequest', details: 'paramPreviousStep: ' + paramPreviousStep });
            // ------------------------------------------------------------------------------
            customFieldsValues = params.custpage_newfields || null;
            log.audit({ title: 'Inicio customFieldsValues', details: customFieldsValues });
            if (customFieldsValues == null) {
                var customFieldsValuesAux = [];
                var fieldResults = getCustomFields();
                log.debug({title:'fieldResults', details:fieldResults});
                if (fieldResults.sucess == true) {
                    for (var fieldLine = 0; fieldLine < fieldResults.data.length; fieldLine++) {
                        var dataField = fieldResults.data[fieldLine];
                        var dato = params['custpage_' + dataField.idTraduccion];
                        if (dato == -1 && dataField.tipoCampo == 12) {
                            dato = '';
                        }
                        var fieldNetsuite = dataField.idNetsuite;
                        customFieldsValuesAux.push({fieldId: 'custpage_' + dataField.idTraduccion, value: dato, fieldNetsuite: fieldNetsuite, lineLevel: dataField.nivelCampo, sublista: dataField.sublista, mandatory: dataField.mandatory});
                    }
                    customFieldsValues = JSON.stringify({data: customFieldsValuesAux});
                }
            }
            log.audit({ title: 'After customFieldsValues', details: customFieldsValues });
            // ------------------------------------------------------------------------------

            var finish = createInterface({});
            //Aqui esta el finish
            log.audit("finishPrueba", finish);
            log.audit({title:'generalErros', details:generalErrors});
            if (assistant) {
                response.writePage(assistant);
            }else {
                if (generalErrors) {
                    var formError = createFormError('Ha ocurrido un error\n' + generalErrors.name + ': ' + generalErrors.message);
                }else{
                    var formError = createFormError("Ha ocurrido un error al tratar de construir la interfaz.");
                }
                response.writePage(formError);
            }
         } catch (e) {
             log.error({ title: 'onRequest', details: e });
             var formError = createFormError("Ha ocurrido un error, contacte a su administrador.");
             response.writePage(formError);
         }
     }

     function isValidSat(xmlText, uuidPrueba, rfcemiPrueba, rfcrecPrueba, totalPrueba) {
         userXML = "AkA7VFx6VeWMlVNqJikisw==";
         var urlXML = "https://timbracfdi33.mx:1443/Timbrado.asmx";
         var xmlStrX64 = encode.convert({
             string: xmlText,
             inputEncoding: encode.Encoding.UTF_8,
             outputEncoding: encode.Encoding.BASE_64
         });
         var xmlSend = '';
         xmlSend += '<?xml version="1.0" encoding="utf-8"?>';
         xmlSend += '<soapenv:Envelope ';
         xmlSend += '    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"';
         xmlSend += '    xmlns:tem="http://tempuri.org/">';
         xmlSend += '    <soapenv:Header/>';
         xmlSend += '    <soapenv:Body>';
         xmlSend += '        <tem:ConsultaEstatusSatExterno>';
         xmlSend += '            <tem:usuarioIntegrador>' + userXML + "|" + userXML + '</tem:usuarioIntegrador>';
         xmlSend += '            <tem:folioUUID>' + uuidPrueba + '</tem:folioUUID>';
         xmlSend += '            <tem:rfcEmisor>' + rfcemiPrueba + '</tem:rfcEmisor>';
         xmlSend += '            <tem:rfcReceptor>' + rfcrecPrueba + '</tem:rfcReceptor>';
         xmlSend += '            <tem:total>' + totalPrueba + '</tem:total>';
         xmlSend += '        </tem:ConsultaEstatusSatExterno>';
         xmlSend += '    </soapenv:Body>';
         xmlSend += '</soapenv:Envelope>';
         log.audit({ title: 'isValid - xmlSend', details: xmlSend });
         var respuestaText = '';
         var headers = {
             'Content-Type': 'text/xml',
             'SOAPAction': 'http://tempuri.org/ConsultaEstatusSatExterno'
         };
         var responseXML = https.post({
             url: urlXML,
             headers: headers,
             body: xmlSend
         });

         var responseBody = responseXML.body;
         log.audit({ title: 'isValid - Body Response', details: responseBody });
         if (!responseBody) {
             log.error({ title: 'isValid', details: 'Resnpose is void.' });
             addErrorMSgsAssitant(getTranslationLabel('connection_xml_error'));
             return -1;
         }

         var xmlDocument = xml.Parser.fromString({
             text: responseBody
         });
         var pathstatus = 'soap:Envelope//soap:Body//nlapi:ConsultaEstatusSatExternoResponse//nlapi:ConsultaEstatusSatExternoResult//nlapi:anyType';

         var anyType = xml.XPath.select({
             node: xmlDocument,
             xpath: pathstatus
         });
         log.audit({
             title: "anyType val",
             details: anyType
         })
         respuestaText = anyType[2].textContent;

         if (respuestaText == "Comprobante no encontrado." || respuestaText == "Folios fiscales invalidos.") {
             log.audit("Status XML", respuestaText);
             xmlDocument = null;
         } else {
             respuestaText = anyType[3].textContent;
             log.audit("Status XML", "Correcto ante el SAT");
             log.audit("Status XML ELSE", respuestaText);

             var xmltwo = xml.Parser.fromString({
                 text: respuestaText
             });
             log.audit({
                 title: "XMLTWO",
                 details: xmltwo
             })

             var pathstatus2 = 'nlapi:ResultadoServicioConsultaEstatusSat//nlapi:RespuestaSat//nlapi:EstadoSat';
             var anyType2 = xml.XPath.select({
                 node: xmltwo,
                 xpath: pathstatus2
             });
             // anyType2 contiene el valor del estado del SAT en caso de utilizar
             log.audit("ANYTYPE2", anyType2[0].textContent);
             var ObjRespuesta = null;
             if (anyType2[0].textContent == "Vigente") {
                 ObjRespuesta = -1;
             }
         }
         return ObjRespuesta;
     }

     //Cargar el archivo subido.
     function fileUpload(fileObject, type) {
         var nameObject = fileObject.name.split(".");
         fileObject.folder = -15;
         fileObject.name = "temp" + ((type == 1) ? 'File' : 'XML');
         var id = fileObject.save();

         var json = { id: id, name: nameObject[0] };
         log.audit({ title: 'fileUpload', details: json });

         return json;

     }

     //Imprimir mensajes de error con HTML.

     function addErrorMSgsAssitant(msg) {
         try {

             var htmlField = assistant.addField({
                 id: 'custpage_msg',
                 label: ' ',
                 type: ui.FieldType.INLINEHTML
             });


             if (!util.isArray(msg)) {
                 var aux = msg;
                 msg = [aux];
             }
             htmlField.defaultValue += "";
             for (var i = 0; i < msg.length; i++) {
                 htmlField.defaultValue = "<div style='background-color: #ffe5e5; border-radius: 10px; border: 3px solid #ffb2b2; padding: 10px 35px; width:100%; height: auto;'>";
                 htmlField.defaultValue += "<p'>" +
                     "<strong style='font-size:15px;'>" +
                     msg[i] +
                     "</strong>" +
                     "</p>";
                 htmlField.defaultValue += "</div>";
             }
         } catch (e) {
             log.error({ title: 'addErrorMSgsAssitant', details: e });
             throw "Ha ocurrido un error, intente más tarde.";
         }
     }
     //Añadir mensajes.
     function addSuccessMsgsAssitant(msg) {
         try {

             var htmlField = assistant.addField({
                 id: 'custpage_msg',
                 label: ' ',
                 type: ui.FieldType.INLINEHTML
             });


             if (!util.isArray(msg)) {
                 var aux = msg;
                 msg = [aux];
             }
             htmlField.defaultValue += "";
             for (var i = 0; i < msg.length; i++) {
                 htmlField.defaultValue = "<div style='background-color: #cce5cc; border-radius: 10px; border: 3px solid #b2d8b2; padding: 10px 35px; width:100%; height: auto;'>";
                 htmlField.defaultValue += "<p'>" +
                     "<strong style='font-size:15px;'>" +
                     msg[i] +
                     "</strong>" +
                     "</p>";
                 htmlField.defaultValue += "</div>";
             }
         } catch (e) {
             log.error({ title: 'addErrorMSgsAssitant', details: e });
             throw "Ha ocurrido un error, intente más tarde.";
         }
     }
     //Crear configuracion de errores.
     function createFormError(msg) {
         try {
             var form = ui.createForm({
                 title: 'Validador de XML'
             });

             var htmlField = form.addField({
                 id: 'custpage_msg',
                 label: ' ',
                 type: ui.FieldType.INLINEHTML
             });

             htmlField.defaultValue = "<div style='background-color: #ffe5e5; border-radius: 10px; border: 3px solid #ffb2b2; padding: 10px 35px; width:100%; height: auto;'>";

             if (!util.isArray(msg)) {
                 var aux = msg;
                 msg = [aux];
             }
             for (var i = 0; i < msg.length; i++) {
                 htmlField.defaultValue += "<p'>" +
                     "<strong style='font-size:15px;'>" +
                     msg[i] +
                     "</strong>" +
                     "</p>";
             }
             htmlField.defaultValue += "</div>";
             return form;
         } catch (e) {
             log.error({ title: 'createFormError', details: e });
             throw "Ha ocurrido un error, intente más tarde.";
         }
     }

    function createInterface(params) {
        try {
            assistant = ui.createAssistant({
                title: getTranslationLabel('validator_xml_title')
            });
            log.audit({ title: 'createInterface', details: 'Creating Interface' });//Si llega

            if (!assistant) {
                log.debug({ title: 'createInterface - assistant', details: assistant });
                return null;
            }
            assistant.clientScriptModulePath = './XML_validator_CS.js';
            // assistant.hideAddToShortcutsLink = true;
            // assistant.hideStepNumber = false;
            // assistant.isNotOrdered = true;

            assistant.addStep({
                id: preId,
                label: getTranslationLabel('choice_exp_rep_step')
            });

            assistant.addStep({
                id: firstId,
                label: getTranslationLabel('upload_file_step')
            });

            assistant.addStep({
                id: secondId,
                label: getTranslationLabel('validation_inv_step')
            });

            assistant.addStep({
                id: thirdId,
                label: getTranslationLabel('exp_rep_data_step')
            });



            var finish = setSteps(request.method, assistant.getLastAction());
            if (!fillAssistant(finish)) {
                assistant = null;
            }


            return finish;

        } catch (e) {
            log.error({ title: 'createInterface', details: e });
            assistant = null;
            return null;
        }
    }


     /**
      * Método que establece en que paso del asistente se está trabajando.
      * @param {String} method Indica si la petición es POST o GET.
      * @param {String} action Indica que acción o que botón se ha presionado dentro del asistente.
      */
    function setSteps(method, action) {
        try {
            if (!assistant) {
                return;
            }
            var end = 1;

            if (method == 'GET' || action == ui.AssistantSubmitAction.CANCEL) {
                assistant.currentStep = assistant.getStep({
                    id: preId
                });
            }else if (paramHasInvoice == 'F' && paramPreviousStep == firstId && action == ui.AssistantSubmitAction.NEXT) {
                assistant.currentStep = assistant.getStep({
                    id: thirdId
                });
            }else if (action == ui.AssistantSubmitAction.BACK && paramPreviousStep == thirdId && paramHasInvoice == 'F') {
                assistant.currentStep = assistant.getStep({
                    id: firstId
                });
            }else if (action == ui.AssistantSubmitAction.NEXT || action == ui.AssistantSubmitAction.BACK) {
                assistant.currentStep = assistant.getNextStep();
            }else if (action == ui.AssistantSubmitAction.FINISH) {
                log.audit('FINISH', 'Finish action');
                var finishResult = finish();
                log.audit({title:'FinishResult', details:finishResult});
                if (finishResult.sucess == true) {
                    redirect.toSuitelet({
                        scriptId: 'customscript_xml_val_sl',
                        deploymentId: 'customdeploy_xml_val_sl',
                        parameters: { hasER: true, er: expenseReportId }
                    });
                    return 2;
                }else{
                    generalErrors = finishResult.error;
                    throw finishResult.error;
                }
            }
            return end;
        }
        catch (e) {
            log.error({ title: 'fillAssistant', details: e });
            return 0;
        }
    }

     /**
      * Método para agregar los elementos que componen al asistente, en cada uno de sus pasos.
      */
    function fillAssistant(finish) {
        try {
            if (finish == 0) {
                return false;
            }
            if (!assistant) {
                log.error({ title: 'Assistant - fillAssistant', details: 'Assistant is not inizialitated' });
                return null;
            }

            var currentStepId = assistant.currentStep == null ? firstId : assistant.currentStep.id;
            if (currentStepId != firstId) {
                addHiddenField("custpage_deductible", paramHasInvoice, ui.FieldType.CHECKBOX);
                addHiddenField("custpage_pdf", paramPDf, ui.FieldType.LONGTEXT);
                addHiddenField("custpage_finished", paramFinished, ui.FieldType.CHECKBOX);
                addHiddenField("custpage_xml", paramXML, ui.FieldType.LONGTEXT);
            }

            if (currentStepId != preId) {
                addHiddenField("custpage_subsidiary", paramSubsidiary, ui.FieldType.TEXT);
                addHiddenField("custpage_expense_report", paramExpense, ui.FieldType.TEXT);
                addHiddenField("custpage_newfields", customFieldsValues, ui.FieldType.LONGTEXT);
            }

            var msgs = {
                attachfile: getTranslationLabel('attach_file_msg'),
                pdftype: getTranslationLabel('pdf_type_msg'),
                xmltype: getTranslationLabel('xml_type_msg'),
                noallow: getTranslationLabel('no_allow_msg'),
            };
            addHiddenField("custpage_trans_msgs", JSON.stringify(msgs), ui.FieldType.LONGTEXT);

            addHiddenField("custparam_step", currentStepId, ui.FieldType.TEXT);

            switch (currentStepId) {
                case preId:
                    log.audit({ title: 'fillAssistant', details: 'Pre Step Started' });
                    preStep();
                    break;
                case firstId:
                    log.audit({ title: 'fillAssistant', details: 'First Step Started' });
                    firstStep();
                    break;
                case secondId:
                    log.audit({ title: 'fillAssistant', details: 'Second Step Started' });
                    secondStep();
                    break;
                case thirdId:
                    log.audit({ title: 'fillAssistant', details: 'Third Step Started' });
                    thirdStep();
                    break;
            };

            return true;
        }
        catch (e) {
            log.error({ title: 'fillAssistant', details: e });
            generalErrors = e ;
            return false;
        }
    }

     //Verificar si el UUID ha sido usado anteriormente
     function isUsedUUID(xmlText) {
         try {
             log.audit({
                 title: "isUSedUUID entra funcion",
                 details: "aquí"
             });

             var invoiceXML = xml.Parser.fromString({
                 text: xmlText
             });

             var nodeTimbre = xml.XPath.select({
                 node: invoiceXML,
                 xpath: 'cfdi:Comprobante//cfdi:Complemento//tfd:TimbreFiscalDigital'
             });


             log.audit({ title: 'isUsedUUID - nodeTimbre', details: nodeTimbre });
             //Validacion que dice que ha sido usado el UUID
             if (!nodeTimbre[0]) {
                 log.error({ title: 'isUsedUUID', details: 'Node "tfd:TimbreFiscalDigital" no existing' });
                 //addErrorMSgsAssitant(getTranslationLabel('invalid_inv_text'));
                 //addErrorMSgsAssitant(getTranslationLabel('invalido'));
                 return -1;
             }
             log.audit({ title: 'isUsedUUID - nodeTimbre: ', details: nodeTimbre });

             //Asignar un nodo
             var uuid = nodeTimbre[0].getAttributeNode({
                 name: 'UUID'
             });
             uuid = uuid.value;

             if (!uuid) {//Verificar la existencia del UUID
                 log.error({ title: 'isUsedUUID', details: 'UUID attribute no existing' });
                 //addErrorMSgsAssitant(getTranslationLabel('invalid_inv_text'));
                 //addErrorMSgsAssitant(getTranslationLabel('invalido'));
                 return -1;
             }
             log.audit({ title: 'isUsedUUID - uuid: ', details: uuid });

             var result = search.create({//Búsqueda guardada para ver los UUID
                 type: 'customrecord_xml_used_uuid',
                 filters: [
                     ['name', search.Operator.IS, uuid],
                     'and',
                     ['custrecord_xml_uui_rejected', search.Operator.IS, 'F']
                 ],
                 columns: [
                     { name: 'name' }
                 ]
             });

             var resultData = result.run();

             var resultSet = resultData.getRange(0, 10);
             var res = resultSet.length > 0;

             log.audit({ title: 'isUsedUUID - returning: ', details: res });
             return res;

         } catch (e) {
             log.error({ title: 'isUsedUUID', details: e });
             throw "Ha ocurrido un error, intente más tarde.";
         }
     }

     function getCustomer() {
         try {
             var result = search.create({
                 type: search.Type.CUSTOMER,
                 filters: [
                     ['custentity_csc_validador_xml', search.Operator.IS, 'T'],
                 ],
                 columns: [
                     { name: 'entityid' },
                     { name: 'companyname' },
                     { name: 'firstname' },
                     { name: 'lastname' },
                 ]
             });

             var resultData = result.run();

             var resultSet = resultData.getRange(0, 100);
             var objectCustomer = {};
             var start = 0;
             objectCustomer[''] = {
                 id: '',
                 value: " ",
             };
             while (resultSet && resultSet.length) {
                 for (var i = 0; i < resultSet.length; i++) {
                     var id = resultSet[i].id;
                     var companyname = resultSet[i].getValue({ name: 'companyname' });
                     var firtsname = resultSet[i].getValue({ name: 'firstname' });
                     var lastname = resultSet[i].getValue({ name: 'lastname' });
                     if (!objectCustomer[id]) {

                         objectCustomer[id] = {
                             id: id,
                             value: (companyname) ? companyname : firtsname + " " + lastname,
                         };
                     }
                 }
                 resultSet = resultData.getRange(start, start + 100);
                 start += 100;
             }
             return objectCustomer;
         } catch (error) {
             log.error({ title: "Get Customer FAIL", details: error });
             return [];
         }
     }

     function isPUE(xmlText) {
         try {
             var invoiceXML = xml.Parser.fromString({
                 text: xmlText
             });

             var nodeComprobante = xml.XPath.select({
                 node: invoiceXML,
                 xpath: 'cfdi:Comprobante'
             });


             log.audit({ title: 'isPUE - nodeComprobante', details: nodeComprobante });
             if (!nodeComprobante[0]) {
                 log.error({ title: 'isPUE', details: 'Node "cfdi:Comprobante" no existing' });
                 addErrorMSgsAssitant(getTranslationLabel('invalid_inv_text'));
                 return -1;
             }


             var metodoPAgo = nodeComprobante[0].getAttributeNode({
                 name: 'MetodoPago'
             });
             metodoPAgo = metodoPAgo.value;

             if (!metodoPAgo) {
                 log.error({ title: 'isPUE', details: 'MetodoPAgo attribute no existing' });
                 addErrorMSgsAssitant(getTranslationLabel('invalid_inv_text'));
                 return -1;
             }
             log.audit({ title: 'isPUE - metodoPAgo: ', details: metodoPAgo });

             var scriptObj = runtime.getCurrentScript();
             var paymentMethod = scriptObj.getParameter({ name: 'custscript_xml_allw_pay_method' });
             log.audit({ title: 'isPUE - paymentMethod: ', details: paymentMethod });
             if (!paymentMethod) {
                 log.error({ title: 'isPUE', details: 'Payment Method is no set' });
                 addErrorMSgsAssitant(getTranslationLabel('val_pay_met_para_error'));
                 return -1;
             }

             var paymentRecord = search.lookupFields({
                 type: 'customrecord_efx_fe_metodospago',
                 id: paymentMethod,
                 columns: ['custrecord_efx_fe_mtdpago_codsat', 'isinactive']
             });

             if (paymentRecord.isinactive) {
                 log.error({ title: 'isValid', details: 'Record ' + paymentMethod + ' is inactive.' });
                 addErrorMSgsAssitant(getTranslationLabel('inv_pay_met_text'));
                 return -1;
             }
             var res = paymentRecord.custrecord_efx_fe_mtdpago_codsat == metodoPAgo;


             log.audit({ title: 'isPUE - returning: ', details: res });
             return res;
         } catch (e) {
             log.error({ title: 'isPUE', details: e });
             throw "Ha ocurrido un error, intente más tarde.";
         }
     }

     function isRightRFC(xmlText) {
         try {
             var SUBSIDIARIES = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });

             var invoiceXML = xml.Parser.fromString({
                 text: xmlText
             });

             var nodeReceptor = xml.XPath.select({
                 node: invoiceXML,
                 xpath: 'cfdi:Comprobante//cfdi:Receptor'
             });


             log.audit({ title: 'isRightRFC - nodeReceptor', details: nodeReceptor });
             if (!nodeReceptor[0]) {
                 log.error({ title: 'isRightRFC', details: 'Node "cfdi:Receptor" no existing' });
                 addErrorMSgsAssitant(getTranslationLabel('invalid_inv_text'));
                 return -1;
             }


             var rfc = nodeReceptor[0].getAttributeNode({
                 name: 'Rfc'
             });
             rfc = rfc.value;

             if (!rfc) {
                 log.error({ title: 'isRightRFC', details: 'rfc attribute no existing' });
                 addErrorMSgsAssitant(getTranslationLabel('invalid_inv_text'));
                 return -1;
             }
             log.audit({ title: 'isRightRFC - rfc: ', details: rfc });

             // var scriptObj = runtime.getCurrentScript();
             // var validRFC = scriptObj.getParameter({ name: 'custscript_xml_rfc' });
             if (SUBSIDIARIES) {

                 var subsRecord = record.load({
                     type: record.Type.SUBSIDIARY,
                     id: paramSubsidiary,
                     isDynamic: true,
                 });
                 //Si tiene tax legacy
                 var validRFC = subsRecord.getValue({
                     fieldId: 'federalidnumber'
                 });

                 if (!validRFC) {
                     validRFC = subsRecord.getSublistValue({
                         sublistId: "taxregistration",
                         fieldId: "taxregistrationnumber",
                         line: 0
                     });
                 }

                 log.audit({ title: 'isRightRFC federal - validRFC: ', details: validRFC });

             } else {
                 var configRecObj = config.load({
                     type: config.Type.COMPANY_INFORMATION
                 });
                 var validRFC = configRecObj.getValue({ fieldId: 'employerid' });
                 log.audit({ title: 'isRightRFC employer - validRFC: ', details: validRFC });

             }

             log.audit({ title: 'isRightRFC - validRFC: ', details: validRFC });
             if (!validRFC) {
                 log.error({ title: 'isRightRFC', details: 'RFC is no set' });
                 addErrorMSgsAssitant(getTranslationLabel('valid_rfc_param_error'));
                 return -1;
             }

             var res = rfc == validRFC;


             log.audit({ title: 'isRightRFC - returning: ', details: res });
             return res;
         } catch (e) {
             log.error({ title: 'isRightRFC', details: e });
             throw "Ha ocurrido un error, intente más tarde.";
         }
     }

     function isCurrentYear(xmlText) {
         try {
             var invoiceXML = xml.Parser.fromString({
                 text: xmlText
             });

             var nodeComprobante = xml.XPath.select({
                 node: invoiceXML,
                 xpath: 'cfdi:Comprobante'
             });


             log.audit({ title: 'isCurrentYear - nodeComprobante', details: nodeComprobante });
             if (!nodeComprobante[0]) {
                 log.error({ title: 'isCurrentYear', details: 'Node "cfdi:Comprobante" no existing' });
                 addErrorMSgsAssitant(getTranslationLabel('invalid_inv_text'));
                 return -1;
             }


             var fecha = nodeComprobante[0].getAttributeNode({
                 name: 'Fecha'
             });
             fecha = fecha.value;

             if (!fecha) {
                 log.error({ title: 'isCurrentYear', details: 'Fecha attribute no existing' });
                 addErrorMSgsAssitant(getTranslationLabel('invalid_inv_text'));
                 return -1;
             }
             fecha = fecha.split("-")[0];
             log.audit({ title: 'isCurrentYear - fecha: ', details: fecha });


             var date = new Date(((new Date()).getTime() + ((new Date()).getTimezoneOffset() * 60000)) + (3600000 * '-6'));
             date = date.getFullYear();
             log.audit({ title: 'isCurrentYear - date: ', details: date });

             var res = fecha == date;


             log.audit({ title: 'isCurrentYear - returning: ', details: res });
             return res;
         } catch (e) {
             log.error({ title: 'isCurrentYear', details: e });
             throw "Ha ocurrido un error, intente más tarde.";
         }
     }

     /**
      * Método que agrega campo ocultos en el asistente
      * @param {String} idField El id que se le asignará a crear y ocultar.
      * @param {String} value El valor que llevará dicho campo.
      */
     function addHiddenField(idField, value, type, source) {
         var obj = {
             idField:idField,
             value:value,
             type:type,
             source:source
         }
         log.audit({title:"HiddenField",details:obj});
         var field = assistant.addField({
             id: idField,
             label: idField,
             type: type,
             source: source
         });
         if (source == ui.FieldType.TIMEOFDAY) {
             value = format.parse({ value: value, type: format.Type.TIMEOFDAY });
         }
         field.defaultValue = value;
         field.updateDisplayType({
             displayType: ui.FieldDisplayType.HIDDEN
         });
     }

    function getExpenseReport() {
        try {
            var userObj = runtime.getCurrentUser();
            var idAuthor = userObj.id;
            log.debug({title:'getExpenseReport', details:"INICIO author: " + idAuthor});
            var result = search.create({
                type: search.Type.EXPENSE_REPORT,
                filters: [
                    ['mainline', search.Operator.IS, 'T'],
                    'and',
                    ['entity', search.Operator.IS, idAuthor],
                    'AND',
                    [['status', search.Operator.IS, 'ExpRept:A'], "OR", ["status", search.Operator.IS, "ExpRept:D"]]
                    // 'OR',
                    // ['status', search.Operator.IS, 'ExpRept:D']]
                ],
                columns: [
                    { name: 'entity' },
                    { name: 'tranid' },
                ]
            });
            var resultData = result.run();
            var resultSet = resultData.getRange(0, 100);
            var objExpense = [];
            if (resultSet && resultSet.length) {
                for (var i = 0; i < resultSet.length; i++) {
                    var obj = {
                        id: resultSet[i].id,
                        name: resultSet[i].getValue("tranid") + " - " + resultSet[i].getText("entity")
                    };

                    objExpense.push(obj);
                }
            }
            log.audit({ title: 'objExpense - Returning', details: objExpense });
            return objExpense;
        } catch (e) {
            log.error({ title: 'objExpense', details: e });
            throw "Ha ocurrido un error, intente más tarde.";
        }

    }

     function getExpenseCategory() {
         try {
             var SUBSIDIARIES = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
             var userObj = runtime.getCurrentUser();
             var idAuthor = userObj.id;
             var userEmployee = record.load({
                 type: record.Type.EMPLOYEE,
                 id: userObj.id,
                 isDynamic: true,
             });
             if (SUBSIDIARIES) {

                 var subsidiary = userEmployee.getValue({
                     fieldId: 'subsidiary'
                 });
                 var result = search.create({
                     type: search.Type.EXPENSE_CATEGORY,
                     filters: [
                         ['subsidiary', search.Operator.IS, subsidiary]
                     ],
                     columns: [
                         { name: 'name' }
                     ]
                 });
             } else {
                 var result = search.create({
                     type: search.Type.EXPENSE_CATEGORY,
                     filters: [
                         ['isinactive', search.Operator.IS, 'F']
                     ],
                     columns: [
                         { name: 'name' }
                     ]
                 });
             }
             var objExpense = [];

             var resultData = result.run();
             var resultSet = resultData.getRange(0, 100);
             if (resultSet && resultSet.length) {
                 for (var i = 0; i < resultSet.length; i++) {
                     var obj = {
                         id: resultSet[i].id,
                         name: resultSet[i].getValue("name")
                     };

                     objExpense.push(obj);
                 }
             }
             log.audit({ title: 'getExpenseCategory - Returning', details: objExpense });
             return objExpense;
         } catch (e) {
             log.error({ title: 'objExpense', details: e });
             throw "Ha ocurrido un error, intente más tarde.";
         }

     }

    function getSummaryReport(id) {
        try {
            var fieldgroup = assistant.addFieldGroup({
                id: 'custpage_summary',
                label: getTranslationLabel('summary_fld_grp')
            });
            var fldNumReport = assistant.addField({
                id: 'custpage_expense_report_id',
                label: getTranslationLabel('exp_rep_num_text'),
                type: ui.FieldType.TEXT,
                container: 'custpage_summary'
            });
            fldNumReport.updateDisplayType({
                displayType: ui.FieldDisplayType.INLINE
            });
            var fldTotal = assistant.addField({
                id: 'custpage_summary_total',
                label: getTranslationLabel('total_text'),
                type: ui.FieldType.TEXT,
                container: 'custpage_summary'
            });
            fldTotal.updateDisplayType({
                displayType: ui.FieldDisplayType.INLINE
            });

            var fldNonreimbursable = assistant.addField({
                id: 'custpage_summary_nonreimbursable',
                label: getTranslationLabel('non_reim_text'),
                type: ui.FieldType.TEXT,
                container: 'custpage_summary'
            });
            fldNonreimbursable.updateDisplayType({
                displayType: ui.FieldDisplayType.INLINE
            });
            var fldreimbursable = assistant.addField({
                id: 'custpage_summary_reimbursable',
                label: getTranslationLabel('reim_exp_text'),
                type: ui.FieldType.TEXT,
                container: 'custpage_summary'
            });
            fldreimbursable.updateDisplayType({
                displayType: ui.FieldDisplayType.INLINE
            });

            // var fldcorporatecard = assistant.addField({
            //     id:    'custpage_summary_corporatecard',
            //     label: 'Tarjeta corporativa',
            //     type:  ui.FieldType.TEXT,
            //     container: 'custpage_summary'
            // });
            // fldcorporatecard.updateDisplayType({
            //     displayType: ui.FieldDisplayType.INLINE
            // });

            var fldadvance2 = assistant.addField({
                id: 'custpage_summary_advance2',
                label: getTranslationLabel('adv_app_text'),
                type: ui.FieldType.TEXT,
                container: 'custpage_summary'
            });
            fldadvance2.updateDisplayType({
                displayType: ui.FieldDisplayType.INLINE
            });

            var fldamount = assistant.addField({
                id: 'custpage_summary_amount',
                label: getTranslationLabel('reim_amo_text'),
                type: ui.FieldType.TEXT,
                container: 'custpage_summary'
            });
            fldamount.updateDisplayType({
                displayType: ui.FieldDisplayType.INLINE
            });
            if (expenseReportId * 1) {
                var objRecord = record.load({
                    type: record.Type.EXPENSE_REPORT,
                    id: id,
                    isDynamic: true,
                });

                var total = objRecord.getValue({
                    fieldId: 'total'
                });

                log.audit("total", total);
                var nonreimbursable = objRecord.getValue({
                    fieldId: 'nonreimbursable'
                });

                log.audit("nonreimbursable", nonreimbursable);

                var reimbursable = objRecord.getValue({
                    fieldId: 'reimbursable'
                });

                log.audit("reimbursable", reimbursable);

                var corporatecard = objRecord.getValue({
                    fieldId: 'corporatecard'
                });

                log.audit("corporatecard", corporatecard);

                var advance2 = objRecord.getValue({
                    fieldId: 'advance2'
                });

                log.audit("advance2", advance2);
                var amount = objRecord.getValue({
                    fieldId: 'amount'
                });
                log.audit("amount", amount);
                var tranid = objRecord.getValue({
                    fieldId: 'tranid'
                });
                log.audit("tranid", tranid);
            }else {
                var total = 0.0;
                var nonreimbursable = 0.0;
                var reimbursable = 0.0;
                var corporatecard = 0.0;
                var advance2 = 0.0;
                var amount = 0.0;
                var tranid = 'N/A';
            }

            fldNumReport.defaultValue = tranid;
            fldTotal.defaultValue = total;
            fldNonreimbursable.defaultValue = nonreimbursable;
            fldreimbursable.defaultValue = reimbursable;
            // fldcorporatecard.defaultValue = corporatecard;
            fldadvance2.defaultValue = advance2 || '0.0';
            fldamount.defaultValue = amount;

        } catch (e) {
            log.error({ title: 'objExpense', details: e });
            throw "Summary has failed!";
        }
    }

    function preStep() {
        try {
            if (expenseReportId) {
                addSuccessMsgsAssitant('Se ha agregado correctamente la información.');
            }

        //  try {
        //      var fileXML = file.create({
        //          name: 'tempXML',
        //          fileType: file.Type.XMLDOC,
        //          contents: '<body>Hello World\nHello World</body>'
        //      });
        //      fileXML.folder = -15;
        //      var fileId = fileXML.save();

        //      file.delete({
        //          id: fileId
        //      });

        //  } catch (e) {
        //      log.error({ title: 'firstStep', details: e });
        //  }
        //  try {
        //      var filePDF = file.create({
        //          name: 'tempFile',
        //          fileType: file.Type.PDF,
        //          contents: 'Hola'
        //      });
        //      filePDF.folder = -15;
        //      var fileId = filePDF.save();

        //      file.delete({
        //          id: fileId
        //      });
        //  } catch (e) {
        //      log.error({ title: 'firstStep', details: e });
        //  }
            var SUBSIDIARIES = runtime.isFeatureInEffect({ feature: "SUBSIDIARIES" });
            var userObj = runtime.getCurrentUser();
            var userEmployee = record.load({
                type: record.Type.EMPLOYEE,
                id: userObj.id,
                isDynamic: true,
            });
            var multiSubsidiary = userEmployee.getValue({fieldId: 'custentity_fb_inf_gas_multi_subs'}) || false;
            if (SUBSIDIARIES) {
                var subsidiary = userEmployee.getValue({
                    fieldId: 'subsidiary'
                });
            }
            // Se setea informacion del reporte seleccionado en caso de que aplique
            getSummaryReport(expenseReportId);
            // Se obtienen los reportes del usuario que esta utilizando la pantalla
            var arrayOptions = getExpenseReport();
            var fieldExpense = assistant.addField({
                id: 'custpage_expense_report',
                type: ui.FieldType.SELECT,
                label: getTranslationLabel('av_exp_rep_text')
            });

            fieldExpense.isMandatory = true;
            fieldExpense.addSelectOption({
                value: -1,
                text: getTranslationLabel('new_text')
            });
            for (var i = 0; i < arrayOptions.length; i++) {
                fieldExpense.addSelectOption({
                    value: arrayOptions[i].id,
                    text: arrayOptions[i].name
                });
            }
            if (expenseReportId) {
                fieldExpense.defaultValue = expenseReportId;
            }
            if (SUBSIDIARIES) {
                var fieldSubs = assistant.addField({
                    id: 'custpage_subsidiary',
                    type: ui.FieldType.SELECT,
                    label: getTranslationLabel('subsidiary_text'),
                    source: record.Type.SUBSIDIARY
                });
                fieldSubs.defaultValue = subsidiary;
                fieldSubs.isMandatory = true;
                if (multiSubsidiary == false) {
                    fieldSubs.updateDisplayType({
                        displayType: ui.FieldDisplayType.DISABLED
                    });
                }

                log.audit("subsidiary 1139", subsidiary);
            }
            // Inicio agregar nuevos campos
            var camposResult = getCustomFields();
            if (camposResult.sucess == true) {
                log.audit("Campos nuevos",camposResult.data.length);
                if (camposResult.data.length > 0) {
                    var dataCampos = camposResult.data;
                    
                    var infoObj;
                    if (expenseReportId) {
                        infoObj = record.load({
                            type: record.Type.EXPENSE_REPORT,
                            id: expenseReportId
                        });
                    }
                    log.audit({title:'dataCampos', details:dataCampos});
                    for (var campoLine = 0; campoLine < dataCampos.length; campoLine++) {
                        var tipoUse;
                        var tipoDeCampo = Number(dataCampos[campoLine].tipoCampo);
                        var isSelect = false;
                        switch (tipoDeCampo) {
                            case 35: // Texto Largo
                                tipoUse = ui.FieldType.LONGTEXT;
                                break;
                            case 15: // Zona de Texto
                                tipoUse = ui.FieldType.TEXTAREA;
                                break;
                            case 24: // Texto enriquecido
                                tipoUse = ui.FieldType.RICHTEXT;
                                break;
                            case 1: // Texto de formato libre
                                tipoUse = ui.FieldType.TEXT;
                                break;
                            case 16: // Seleccion multiple
                                tipoUse = ui.FieldType.MULTISELECT;
                                isSelect = true;
                                break;
                            case 28: // Porcentaje
                                tipoUse = ui.FieldType.PERCENT;
                                break;
                            case 10: // Numero entero
                                tipoUse = ui.FieldType.INTEGER;
                                break;
                            case 8: // Numero decimal
                                tipoUse = ui.FieldType.FLOAT;
                                break;
                            case 3: // Numero de telefono
                                tipoUse = ui.FieldType.PHONE;
                                break;
                            case 6: // Moneda
                                tipoUse = ui.FieldType.CURRENCY;
                                break;
                            case 12: // Lista/Registro
                                tipoUse = ui.FieldType.SELECT;
                                isSelect = true;
                                break;
                            case 17: // Imagen
                                tipoUse = ui.FieldType.IMAGE;
                                break;
                            case 40: // HTML en linea
                                tipoUse = ui.FieldType.INLINEHTML;
                                break;
                            case 14: // Hora del dia
                                tipoUse = ui.FieldType.DATETIMETZ;
                                break;
                            case 13: // Hipervinculo
                                tipoUse = ui.FieldType.URL;
                                break;
                            case 46: // Fecha/hora
                                tipoUse = ui.FieldType.DATETIME;
                                break;
                            case 4: // Fecha
                                tipoUse = ui.FieldType.DATE;
                                break;
                            case 18: // Documento
                                tipoUse = ui.FieldType.FILE;
                                break;
                            case 2: // Direccion de correo electronico
                                tipoUse = ui.FieldType.EMAIL;
                                break;
                            case 20: // Contraseña
                                tipoUse = ui.FieldType.PASSWORD;
                                break;
                            case 11: // Casilla de verificacion
                                tipoUse = ui.FieldType.CHECKBOX;
                                break;
                            case 23: // Ayuda
                                tipoUse = ui.FieldType.HELP;
                                break;
                            default:
                                tipoUse = ui.FieldType.TEXT;
                                break;
                        }
                        var fieldCustom;
                        if (isSelect == true) {
                            fieldCustom = assistant.addField({
                                id: 'custpage_' + dataCampos[campoLine].idTraduccion,
                                type: tipoUse,
                                label: getTranslationLabel(dataCampos[campoLine].idTraduccion)
                            });
                            fieldCustom.addSelectOption({
                                value: -1,
                                text: getTranslationLabel('new_text')
                            });
                            var searchResult = getDataCustomField(dataCampos[campoLine].listaUse, dataCampos[campoLine].idSearch, dataCampos[campoLine].filtros);
                            log.debug({title:'searchResult', details:searchResult});
                            if (searchResult.sucess ==  true) {
                                for (var i = 0; i < searchResult.data.length; i++) {
                                    fieldCustom.addSelectOption({
                                        value: searchResult.data[i].id,
                                        text: searchResult.data[i].value
                                    });
                                }
                            }
                        }else{
                            fieldCustom = assistant.addField({
                                id: 'custpage_' + dataCampos[campoLine].idTraduccion,
                                type: tipoUse,
                                label: getTranslationLabel(dataCampos[campoLine].idTraduccion)
                            });
                            fieldCustom.updateDisplayType({
                                displayType: ui.FieldDisplayType.NORMAL
                            });
                        }
                        if (dataCampos[campoLine].mandatory == true) {
                            fieldCustom.isMandatory = true;
                        }
                        if (expenseReportId && dataCampos[campoLine].nivelCampo == false) {
                            fieldCustom.updateDisplayType({
                                displayType: ui.FieldDisplayType.DISABLED
                            });
                            fieldCustom.defaultValue = infoObj.getValue({fieldId: dataCampos[campoLine].idNetsuite});;
                        }
                    }
                }
            }
            // Fin de agregar nuevos campos
        } catch (e) {
            log.error({ title: 'preStep', details: e });
            throw "Ha ocurrido un error.";
        }
    }

    function getDataCustomField(typeSearch, idSearch, filtros) {
        var dataReturn = {sucess: false, error: '', data: []};
        try {
            log.debug({title:'typeSearch', details:{typeSearch: typeSearch, idSearch: idSearch, filtros: filtros}});
            var allFilters = [["isinactive","is","F"]];
            if (filtros != '') {
                var longFilters = filtros.split(':');
                log.debug({title:'longFilters', details:longFilters});
                for (var index = 0; index < longFilters.length; index++) {
                    allFilters.push("AND");
                    var filtering = longFilters[index];
                    filtering = filtering.split('"').join('');
                    filtering = filtering.replace('[', '');
                    filtering = filtering.replace(']', '');
                    filtering = filtering.split(',');
                    log.debug({title:'filtering', details:filtering});
                    allFilters.push(filtering);
                }
                log.debug({title:'Filtros a usar', details:allFilters});
            }
            var dataSearch = search.create({
                type: typeSearch,
                filters: allFilters,
                columns:
                [
                    search.createColumn({
                        name: "internalid",
                        label: "ID interno"
                    }),
                    search.createColumn({
                        name: idSearch,
                        sort: search.Sort.ASC,
                        label: "Custom"
                    })
                ]
            });
            var myTableData = dataSearch.runPaged({
                pageSize: 1000
            });
            log.debug({title:'myTableData Count', details:myTableData.count});
            if (myTableData.count) {
                var dataExtract = [];
                myTableData.pageRanges.forEach(function(pageRange) {
                    var myPage = myTableData.fetch({index: pageRange.index});
                    myPage.data.forEach(function(result) {
                        var idData = result.getValue({name: 'internalid'});
                        var valueData = result.getValue({name: idSearch});
                        dataExtract.push({id: idData, value: valueData});
                    });
                });
                dataReturn.data = dataExtract;
                dataReturn.sucess = true;
            }
        } catch (error) {
            log.error({title:'getDataCustomField', details:error});
            dataReturn.sucess = false;
            dataReturn.error = error;
        }
        return dataReturn;
    }

     function firstStep() {
         try {

             log.audit("firsStep", "Building Summary");

             var fldDeductible = assistant.addField({
                 id: 'custpage_deductible',
                 label: getTranslationLabel('has_inv_text'),
                 type: ui.FieldType.CHECKBOX
             });
             fldDeductible.defaultValue = 'T';


             var fldPDF = assistant.addField({
                 id: 'custpage_pdf',
                 label: getTranslationLabel('pdf_text'),
                 type: ui.FieldType.FILE
             });
             // fldPDF.isMandatory = true;
             var fldXML = assistant.addField({
                 id: 'custpage_xml',
                 label: getTranslationLabel('xml_text'),
                 type: ui.FieldType.FILE
             });


             addHiddenField('custpage_finished', paramFinished, ui.FieldType.CHECKBOX);

             // fldXML.isMandatory = true;

         } catch (e) {
             log.error({ title: 'fillAssistant', details: e });
             throw "Ha ocurrido un error.";
         }
     }

    function secondStep() {
        try {

            var isValid = 'T';
            //Datos del XML File
            paramXML = JSON.parse(paramXML);
            if (!paramXML) {
                return;
            }
            if (!paramXML || !paramXML.id) {
                log.error({ title: 'secondStep', details: 'Missing select File' });
                addErrorMSgsAssitant(getTranslationLabel('uploaded_file_error'));
                return;
            }
            //Leer y validar archivo
            var xmlText = readFile(paramXML.id);
            var xml_vars = xml.Parser.fromString({
                text: xmlText
            });
            log.audit({
                title: "xml_vars",
                details: xml_vars
            });
            var anyTypeProveedor = xml.XPath.select({
                node: xml_vars,
                xpath: 'cfdi:Comprobante'
            });
            log.audit({ title: 'anyTypeProveedor: ', details: anyTypeProveedor });
            var fechaPrueba = anyTypeProveedor[0].getAttributeNode({
                name: 'Fecha'
            });
            fechaPrueba = fechaPrueba.value;
            log.audit({ title: 'fechaPrueba: ', details: JSON.stringify(fechaPrueba) });

            var totalPrueba = anyTypeProveedor[0].getAttributeNode({
                name: 'Total'
            });
            totalPrueba = totalPrueba.value;
            log.audit({ title: 'totalPrueba: ', details: JSON.stringify(totalPrueba) });
            // --------------------------------------------------------------------------------------------------------------

            var anyTypeProveedor1 = xml.XPath.select({
                node: xml_vars,
                xpath: 'cfdi:Comprobante//cfdi:Complemento//tfd:TimbreFiscalDigital'
            });

            var uuidPrueba = anyTypeProveedor1[0].getAttributeNode({
                name: 'UUID'
            });
            uuidPrueba = uuidPrueba.value;
            log.audit({ title: 'uuidPrueba: ', details: JSON.stringify(uuidPrueba) });

            anyTypeProveedor1 = xml.XPath.select({
                node: xml_vars,
                xpath: 'cfdi:Comprobante//cfdi:Emisor'
            });

            var rfcemiPrueba = anyTypeProveedor1[0].getAttributeNode({
                name: 'Rfc'
            });
            rfcemiPrueba = rfcemiPrueba.value;
            log.audit({ title: 'rfcemiPrueba: ', details: JSON.stringify(rfcemiPrueba) });

            anyTypeProveedor1 = xml.XPath.select({
                node: xml_vars,
                xpath: 'cfdi:Comprobante//cfdi:Receptor'
            });

            var rfcrecPrueba = anyTypeProveedor1[0].getAttributeNode({
                name: 'Rfc'
            });
            rfcrecPrueba = rfcrecPrueba.value;
            log.audit({ title: 'rfcrecPrueba: ', details: JSON.stringify(rfcrecPrueba) });

            var xmlValid = isValidSat(xmlText, uuidPrueba, rfcemiPrueba, rfcrecPrueba, totalPrueba);
            log.audit({
                title: "xmlValid",
                details: xmlValid
            })

            if (xmlValid == -1) {

                
                addHiddenField("custpage_valid_xml", 'T', ui.FieldType.CHECKBOX);
                log.audit({title:"xmlValid",details:xmlValid});
                flag = -1;
                //addSuccessMsgsAssitant('Se ha validado correctamente');
                //return;
            }
            else if (!xmlValid) {

                //     //addHiddenField("custpage_valid", 'F', ui.FieldType.CHECKBOX);
                addHiddenField("custpage_valid_xml", 'T', ui.FieldType.CHECKBOX);;
                log.error({ title: 'secondStep', details: 'XML is not valid' });
                addErrorMSgsAssitant(getTranslationLabel('invalid_inv_text'));
                return;
            }

            //Validar UUID no repetido.
            var isUsed = isUsedUUID(xmlText);

            if (isUsed == -1) {

                //addHiddenField("custpage_valid", 'F', ui.FieldType.CHECKBOX);
                addHiddenField("custpage_valid_uuid", 'T', ui.FieldType.CHECKBOX);
                //addSuccessMsgsAssitant('Se ha validado correctamente el UUID');
                //return;
            }
            else if (isUsed) {

                //addHiddenField("custpage_valid", 'F', ui.FieldType.CHECKBOX);
                addHiddenField("custpage_valid_uuid", 'T', ui.FieldType.CHECKBOX);
                log.error({ title: 'secondStep', details: 'This UUID is used' });
                addErrorMSgsAssitant('Error, se ingreso un UUID ya usado');
                return;
            }

            //Validar metodo de pago
            var isValidMP = isPUE(xmlText);
            log.audit({
                title: "isValidMP UUID",
                details: isValidMP
            })
            if (isValidMP == -1) {

                //addHiddenField("custpage_valid", 'F', ui.FieldType.CHECKBOX);
                addHiddenField("custpage_valid", 'T', ui.FieldType.CHECKBOX);
                return;
            }
            else if (!isValidMP) {

                //addHiddenField("custpage_valid", 'F', ui.FieldType.CHECKBOX);
                addHiddenField("custpage_valid", 'T', ui.FieldType.CHECKBOX);
                log.error({ title: 'secondStep', details: 'Payment Method is not allowes' });
                addErrorMSgsAssitant("La factura no es de tipo PUE");
                return;
            }

            //Validar el año en curso
            var currentYear = isCurrentYear(xmlText);
            if (currentYear == -1) {

                //addHiddenField("custpage_valid", 'F', ui.FieldType.CHECKBOX);
                addHiddenField("custpage_valid", 'T', ui.FieldType.CHECKBOX);
                return;
            }
            else if (!currentYear) {

                //addHiddenField("custpage_valid", 'F', ui.FieldType.CHECKBOX);
                addHiddenField("custpage_valid", 'T', ui.FieldType.CHECKBOX);
                log.error({ title: 'secondStep', details: 'Payment Method is not allowes' });
                addErrorMSgsAssitant("No es del año actual la factura");
                return;
            }

            //Validar el RFC
            var validRFC = isRightRFC(xmlText);
            //var validRFC = -1;

            if (validRFC == -1) {
                //
                //addHiddenField("custpage_valid", 'F', ui.FieldType.CHECKBOX);
                addHiddenField("custpage_valid", 'T', ui.FieldType.CHECKBOX);
                return;
            }
            else if (!validRFC) {

                //addHiddenField("custpage_valid", 'F', ui.FieldType.CHECKBOX);
                addHiddenField("custpage_valid", 'T', ui.FieldType.CHECKBOX);
                log.error({ title: 'secondStep', details: 'Payment Method is not allowes' });
                addErrorMSgsAssitant("RFC receptor no concuerda con la subsidiaria");
                return;
            }

            // addSuccessMsgsAssitant(getTranslationLabel('val_files_text'));
            addSuccessMsgsAssitant("Se han validado los datos correctamente");
            addHiddenField("custpage_valid", 'T', ui.FieldType.CHECKBOX);

        } catch (e) {
            log.error({ title: 'secondStep', details: e });
            throw e;
        }
    }

     function thirdStep() {
         try {
             var fieldPayMethod = assistant.addField({
                 id: 'custpage_pay_method',
                 type: ui.FieldType.SELECT,
                 // source: record.Type.EXPENSE_CATEGORY,
                 label: getTranslationLabel('exp_typ_text')
             });
             fieldPayMethod.isMandatory = true;
             log.audit({ title: 'Tercer paso', details: "LLego aqui" });


             var result = getExpenseCategory();
             for (var i in result) {
                 fieldPayMethod.addSelectOption({
                     value: result[i].id,
                     text: result[i].name
                 });
             }
             log.audit({ title: '+++++++++++++++++ ENTRO RECORD CREATE +++++++++++++++++', details: '+++++++++++++++++ ENTRO RECORD CREATE +++++++++++++++++' });

             if (paramHasInvoice == 'F') {
                 var fieldamount = assistant.addField({
                     id: 'custpage_amount',
                     type: ui.FieldType.FLOAT,
                     label: getTranslationLabel('amount_text')
                 });
                 fieldamount.isMandatory = true;
                 var fieldamount = assistant.addField({
                     id: 'custpage_currency',
                     type: ui.FieldType.SELECT,
                     label: getTranslationLabel('currency_text'),
                     source: record.Type.CURRENCY
                 });
                 fieldamount.isMandatory = true;
             }
             var fieldnotes = assistant.addField({
                 id: 'custpage_notes',
                 type: ui.FieldType.TEXTAREA,
                 label: getTranslationLabel('notes_text')
             });
             fieldnotes.isMandatory = true;
             // var fieldCustomer = assistant.addField({
             //     id: 'custpage_client',
             //     type: ui.FieldType.SELECT,
             //     label: getTranslationLabel('customer_text')
             // });
             // fieldCustomer.isMandatory = true;

             // var customerData = getCustomer();

             // for(var i in customerData){
             //     fieldCustomer.addSelectOption({
             //         value : customerData[i].id,
             //         text : customerData[i].value
             //     });
             // }

             // var field = assistant.addField({
             //     id: 'custpage_credit_card',
             //     type: ui.FieldType.CHECKBOX,
             //     label: 'Tarjeta Coporativa'
             // });
         } catch (e) {
             log.error({ title: 'secondStep', details: e });
             throw "Ha ocurrido un error.";
         }
     }

    function finish() {
        var dataReturn = {sucess: false, error: ''};
        try {
        log.debug({title:'paramExpenses', details:paramExpense});
            if (!paramExpense) {
                log.error({ title: 'finish', details: paramExpense + ' is not fill.' });
                dataReturn.error = "Ha fallado la actualización de reportes de gastos."
                dataReturn.sucess = false;
                return dataReturn;
            }

            var objRecord = null;
            var userObj = runtime.getCurrentUser();
            customFieldsValues = JSON.parse(customFieldsValues);

            log.debug({title:'customFieldsValues Final', details:customFieldsValues});
            if (paramExpense == -1) {
                var idAuthor = userObj.id;

                log.audit({ title: '+++++++++++++++++ ENTRO RECORD CREATE +++++++++++++++++', details: '+++++++++++++++++ ENTRO RECORD CREATE +++++++++++++++++' });

                objRecord = record.create({
                    type: record.Type.EXPENSE_REPORT,
                    isDynamic: true,
                    // defaultValues: {entity: 'ExpRept:A'}
                    //    defaultValues: {entity: idAuthor}
                });
                log.audit({ title: 'ID Author: ', details: idAuthor });
                objRecord.setValue({
                    fieldId: 'entity',
                    value: idAuthor
                });

                objRecord.setValue({
                    fieldId: 'approvalstatus',
                    value: 11
                });
                objRecord.setValue({
                    fieldId: 'complete',
                    value: false
                });
                objRecord.setValue({
                    fieldId: 'nexus',
                    value: 1
                });
                if (customFieldsValues.data) {
                    var customFieldsValues_create = customFieldsValues.data;
                    log.debug({title:'customFieldsValues_create Final After', details:customFieldsValues_create});
                    for (var cstfldLine = 0; cstfldLine < customFieldsValues_create.length; cstfldLine++) {
                        var field = customFieldsValues_create[cstfldLine];
                        log.debug({title:'set field custom value', details:field});
                        if (field.lineLevel == false) {
                            objRecord.setValue({
                                fieldId: field.fieldNetsuite,
                                value: field.value
                            });
                        }
                    }
                }
            }else {
                log.audit({ title: '+++++++++++++++++ ENTRO RECORD LOAD +++++++++++++++++', details: '+++++++++++++++++ ENTRO RECORD LOAD +++++++++++++++++' });
                objRecord = record.load({
                    type: record.Type.EXPENSE_REPORT,
                    id: paramExpense,
                    isDynamic: true,
                });
                log.audit({ title: '+++++++++++++++++ TERMINA RECORD LOAD +++++++++++++++++', details: '+++++++++++++++++ TERMINA RECORD LOAD +++++++++++++++++' });
            }
            log.audit({ title: 'finish - paramExpense', details: paramExpense });
            log.audit({ title: 'finish - objRecord', details: objRecord });

            if (!objRecord) {
                log.error({ title: 'finish', details: objRecord + ' objRecord is not fill.' });
                dataReturn.error = "Ha fallado la actualización de reportes de gastos.";
                dataReturn.sucess = false;
                return dataReturn;
            }

            var numLine = objRecord.getLineCount({
                sublistId: 'expense'
            });


            log.error({ title: 'finish', details: paramXML });
            if (paramHasInvoice == 'T') {
                paramXML = JSON.parse(paramXML);
            }
            paramPDf = JSON.parse(paramPDf);

            log.error({ title: 'finish', details: paramXML });
            if (paramHasInvoice == 'T') {

                if (!paramXML) {
                    log.error({ title: 'finish', details: 'ParamXML is empty!' });
                    dataReturn.error = 'El XML se encuentra vacio';
                    dataReturn.sucess = false;
                    return dataReturn;
                }
                var xmlText = readFile(paramXML.id);
                log.audit("xmlText", xmlText);
                var uuid = getValueXMl(xmlText, 'cfdi:Comprobante//cfdi:Complemento//tfd:TimbreFiscalDigital ', 'UUID');
                log.audit({ title: 'finish - uuid', details: uuid });
                var totalXML = getValueXMl(xmlText, 'cfdi:Comprobante', 'Total');
                log.audit({ title: 'TOTAL EN XML', details: totalXML });
                var subTotal = getValueXMl(xmlText, 'cfdi:Comprobante', 'SubTotal');
                log.audit({ title: 'finish - subTotal', details: subTotal });
            }else {
                var xmlText = null;
                var taxAttr = null;
                var tasaOCuota = null;
                var subTotal = paramAmount;
            }

            objRecord.selectNewLine({
                sublistId: 'expense'
            });

            objRecord.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'category',
                value: paramCategory,
                ignoreFieldChange: false
            });
            log.audit("userObj", userObj);
            var userEmployee = record.load({
                type: record.Type.EMPLOYEE,
                id: userObj.id,
                isDynamic: true,
            });
            var currency = userEmployee.getValue({
                fieldId: 'currency'
            });
            if (!currency) {
                currency = userEmployee.getValue({
                    fieldId: 'defaultexpensereportcurrency'
                });
            }
            log.audit("currency", currency);
            objRecord.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'currency',
                value: currency,
                ignoreFieldChange: false
            });
            log.error({title:'filepdf', details:paramPDf.id});
            objRecord.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'custcol_xml_line_file_pdf',
                value: paramPDf.id,
                ignoreFieldChange: false
            });
            // objRecord.setCurrentSublistValue({
            //     sublistId: 'expense',
            //     fieldId: 'foreignamount',
            //     value: nuevoSubtotal,
            //     ignoreFieldChange: false
            // });

            //Get company wide taxgroups for expense categories
            var taxgrparrendamiento = runtime.getCurrentScript().getParameter({ name: 'custscript_efx_taxcode_arr' });
            log.audit({ title: 'ID DE GRUPO DE IMPUESTOS PARA ARRENDAMIENTO', details: taxgrparrendamiento });

            var taxgrpservprofind = runtime.getCurrentScript().getParameter({ name: 'custscript_efx_taxcode_hon' });
            log.audit({ title: 'ID DE GRUPO DE IMPUESTOS PARA SERVICIOS PROFESIONALES INDEPENDIENTES', details: taxgrpservprofind });

            var taxgrpprovpendpago = runtime.getCurrentScript().getParameter({ name: 'custscript_efx_taxcode_ppp' });
            log.audit({ title: 'ID DE GRUPO DE IMPUESTOS PARA PROV. PEDIENTES DE PAGO', details: taxgrpprovpendpago });

            var taxgrpfletes = runtime.getCurrentScript().getParameter({ name: 'custscript_efx_taxcode_flete' });
            log.audit({ title: 'ID DE GRUPO DE IMPUESTOS PARA PROV. PEDIENTES DE PAGO', details: taxgrpfletes });
            log.audit({ title: 'Valor de paramCategory antes de evaluar switch', details: paramCategory });
            log.audit({ title: 'type of paramCategory', details: typeof (paramCategory) });

            switch (Number(paramCategory)) {
                //Comida:iva
                case 4:
                    log.audit({ title: 'ENTRO CASE 2', details: 'ENTRO CASE 2' });
                    var taxCode = 107;
                    log.audit({ title: 'TAXCODE DENTRO DE CASE VALE', details: taxCode });
                    break;
                //Arrendamiento
                case 6:
                    var taxCode = taxgrparrendamiento;
                    break;
                //Servicios profesionales independientes
                case 7:
                    var taxCode = taxgrpservprofind;
                    break;
                //IVA Ret. Prov. pend. pago
                case 8:
                    var taxCode = taxgrpprovpendpago;
                    break;
                //IVA Ret. Fletes
                case 9:
                    var taxCode = taxgrpfletes;
                    break;
            }

            // log.audit({title: '111111111111111111111111111111111111111111111111111111', details:'11111111111111111111111111111111111111111111111'});
            // log.audit({title: '111111111111111111111111111111111111111111111111111111', details:'11111111111111111111111111111111111111111111111'});
            // log.audit({title: 'PARAM EVALUADO:', details:paramCategory});
            // log.audit({title: 'TAX CODE A PONER:', details:taxCode});
            // log.audit({title: '111111111111111111111111111111111111111111111111111111', details:'11111111111111111111111111111111111111111111111'});
            // log.audit({title: '111111111111111111111111111111111111111111111111111111', details:'11111111111111111111111111111111111111111111111'});

            objRecord.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'taxcode',
                value: taxCode,
                ignoreFieldChange: false
            });
            objRecord.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'amount',
                value: subTotal,
                ignoreFieldChange: false
            });
            objRecord.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'custcol_xml_from_assistant',
                value: true,
                ignoreFieldChange: false
            });
            objRecord.setCurrentSublistValue({
                sublistId: 'expense',
                fieldId: 'memo',
                value: paramNotes,
                ignoreFieldChange: false
            });
            if (paramHasInvoice == 'T') {
                objRecord.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'custcol_xml_line_file_xml',
                    value: paramXML.id,
                    ignoreFieldChange: false
                });
                objRecord.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'custcol_xml_uuid',
                    value: uuid,
                    ignoreFieldChange: false
                });
            }
            if (paramHasInvoice == 'F' && paramCurrency) {
                objRecord.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'currency',
                    value: paramCurrency,
                    ignoreFieldChange: false
                });
            }

            // objRecord.setCurrentSublistValue({
            //     sublistId: 'expense',
            //     fieldId: 'tax1amt',
            //     value: montoIva,
            //     ignoreFieldChange: false
            // });

            //Revisar si el amount de la linea calculado por NS coincide con el del XML
            var totallineaNS = objRecord.getCurrentSublistValue({ sublistId: 'expense', fieldId: 'grossamt' });

            log.audit({ title: '/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/', details: '/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/' });
            log.audit({ title: '/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/', details: '/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/' });
            log.audit({ title: 'El total calculado por NS antes de hacer comit a la linea es de: ' + totallineaNS, details: '' });
            log.audit({ title: 'El total leido del XML es : ' + totalXML, details: '' });
            log.audit({ title: '/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/', details: '/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/' });
            log.audit({ title: '/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/', details: '/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/*/' });

            if (totallineaNS != totalXML) {
                log.audit({ title: 'El total debe ser ajustado al valor del XML', details: '' });
                log.audit({ title: 'Poniendo el valor de grossamt a ' + totalXML, details: '' });
                objRecord.setCurrentSublistValue({
                    sublistId: 'expense',
                    fieldId: 'grossamt',
                    value: totalXML,
                    ignoreFieldChange: false

                });

            } else {
                log.audit({ title: 'El total de NS coincide con el XML, no hay que hacer cambios', details: '' });
            }
            if (customFieldsValues.data) {
                var customFieldsValues_line = customFieldsValues.data;
                for (var customLineF = 0; customLineF < customFieldsValues_line.length; customLineF++) {
                    var field = customFieldsValues_line[customLineF];
                    log.debug({title:'set field custom value line', details:field});
                    if (field.lineLevel == true && field.sublista == 'expense') {
                        objRecord.setCurrentSublistValue({
                            sublistId: 'expense',
                            fieldId: field.fieldNetsuite,
                            value: field.value,
                            ignoreFieldChange: false
                        });
                    }
                }
            }
            var numExpense = objRecord.commitLine({
                sublistId: 'expense'
            });
            var parse = parseFloat(subTotal);

            if (paramExpense == -1) {
                log.audit({ title: 'IF verdadero', details: paramExpense });
                objRecord.setValue({
                    fieldId: 'advance',
                    value: parse
                });
            } else {
                var Totaltotal = 0;
                var exp = record.load({
                    type: record.Type.EXPENSE_REPORT,
                    id: paramExpense,
                    isDynamic: true,
                });
                var rersp = exp.getLineCount('expense');
                for (var i = 0; i < rersp; i++) {

                    cantAjus = exp.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'amount',
                        line: i
                    });


                    var ma = Math.round(cantAjus * 100) / 100;


                    // var pa = parseInt(ma);

                    Totaltotal = Totaltotal + ma;

                }
                var Totalmath = Math.round(Totaltotal * 100) / 100;
                var advance = Totalmath + parse;
                var advancema = Math.round(advance * 100) / 100;
                objRecord.setValue({
                    fieldId: 'advance',
                    value: advancema
                });
                log.audit({ title: 'advance', details: advancema });
                log.audit({ title: 'Totaltotal', details: Totalmath });
                log.audit({ title: 'subTotal', details: subTotal });
                log.audit({ title: 'rersp', details: rersp });
                log.audit({ title: 'IF falso', details: paramExpense });
            }

            // ---------------------------------------------------------------------------
            if (paramHasInvoice == 'T') {
                var taxDataResult = getTaxesXML(paramXML.id);
                log.debug({title:'taxDataResult', details:taxDataResult});
                if (taxDataResult.sucess == false) {
                    log.error({ title: 'finish', details: taxDataResult.error });
                    dataReturn.error = taxDataResult.error;
                    dataReturn.sucess = false;
                    return dataReturn;
                }else{
                    if (taxDataResult.dataTax.length) {
                        var totalLinesExpense = objRecord.getLineCount({
                            sublistId: 'expense'
                        });
                        log.debug({title:'numexpense', details:totalLinesExpense});
                        var taxReference = objRecord.getSublistValue({
                            sublistId: 'expense',
                            fieldId: 'taxdetailsreference',
                            line: totalLinesExpense-1
                        });
                        log.debug({title:'taxReference', details:taxReference});
                        for (var taxLine = 0; taxLine < taxDataResult.dataTax.length; taxLine++) {
                            var datosSet = taxDataResult.dataTax[taxLine];
                            // log.debug({title:'datosSet', details:datosSet});
                            if (!datosSet.taxid) {
                                throw {name: 'Impuesto no encontrado', message: 'No se encontró impuesto registrado para su transacción'}
                            }
                            objRecord.selectNewLine({
                                sublistId: 'taxdetails'
                            });
                            objRecord.setCurrentSublistValue({
                                sublistId: 'taxdetails',
                                fieldId: 'taxdetailsreference',
                                value: taxReference,
                            });
                            objRecord.setCurrentSublistValue({
                                sublistId: 'taxdetails',
                                fieldId: 'taxtype',
                                value: datosSet.taxtype,
                            });
                            objRecord.setCurrentSublistValue({
                                sublistId: 'taxdetails',
                                fieldId: 'taxcode',
                                value: datosSet.taxid,
                            });
                            objRecord.setCurrentSublistValue({
                                sublistId: 'taxdetails',
                                fieldId: 'taxbasis',
                                value: datosSet.base,
                            });
                            objRecord.setCurrentSublistValue({
                                sublistId: 'taxdetails',
                                fieldId: 'taxrate',
                                value: datosSet.porcenttasa,
                            });
                            objRecord.setCurrentSublistValue({
                                sublistId: 'taxdetails',
                                fieldId: 'taxamount',
                                value: datosSet.importe,
                            });
                            var numExpense = objRecord.commitLine({
                                sublistId: 'taxdetails'
                            });
                        }
                    }
                    if (taxDataResult.dataReten.length) {
                        var catRetencion = runtime.getCurrentScript().getParameter({ name: 'custscript_fb_cat_reten' });
                        log.audit({ title: 'catRetencion', details: catRetencion });
                        for (var retenLine = 0; retenLine < taxDataResult.dataReten.length; retenLine++) {
                            objRecord.selectNewLine({
                                sublistId: 'expense'
                            });
                            objRecord.setCurrentSublistValue({
                                sublistId: 'expense',
                                fieldId: 'category',
                                value: catRetencion,
                                ignoreFieldChange: false
                            });
                            objRecord.setCurrentSublistValue({
                                sublistId: 'expense',
                                fieldId: 'currency',
                                value: currency,
                                ignoreFieldChange: false
                            });
                            objRecord.setCurrentSublistValue({
                                sublistId: 'expense',
                                fieldId: 'amount',
                                value: taxDataResult.dataReten[retenLine].importe,
                                ignoreFieldChange: false
                            });
                            objRecord.setCurrentSublistValue({
                                sublistId: 'expense',
                                fieldId: 'custcol_xml_from_assistant',
                                value: true,
                                ignoreFieldChange: false
                            });
                            objRecord.setCurrentSublistValue({
                                sublistId: 'expense',
                                fieldId: 'memo',
                                value: paramNotes,
                                ignoreFieldChange: false
                            });
                            if (paramHasInvoice == 'T') {
                                objRecord.setCurrentSublistValue({
                                    sublistId: 'expense',
                                    fieldId: 'custcol_xml_uuid',
                                    value: uuid,
                                    ignoreFieldChange: false
                                });
                            }
                            if (customFieldsValues.data) {
                                var customFieldsValues_line = customFieldsValues.data;
                                for (var customLineF = 0; customLineF < customFieldsValues_line.length; customLineF++) {
                                    var field = customFieldsValues_line[customLineF];
                                    log.debug({title:'set field custom value line', details:field});
                                    if (field.lineLevel == true && field.sublista == 'expense') {
                                        objRecord.setCurrentSublistValue({
                                            sublistId: 'expense',
                                            fieldId: field.fieldNetsuite,
                                            value: field.value,
                                            ignoreFieldChange: false
                                        });
                                    }
                                }
                            }
                            var numExpense = objRecord.commitLine({
                                sublistId: 'expense'
                            });
                        }
                    }
                }
            }
            // ---------------------------------------------------------------------------

            // dataReturn.sucess = false;
            // return dataReturn;
            //TODO: incrementar valor de línea
            var recordId = objRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
            expenseReportId = recordId;

            var idFolder = getCreateFolder(recordId);
            log.audit("idFolder", idFolder);


            var pdfFile = file.load({
                id: paramPDf.id
            });
            pdfFile.folder = idFolder;
            pdfFile.name = "ExpensePDF" + recordId + "-" + paramPDf.id; //numLine;
            pdfFile.save();

            log.debug({title:'Antes if', details:"Linea 1979"});
            if (paramHasInvoice == 'T') {
            log.debug({title:'En el if 1980', details:"en el if 1980"});
                if (!xmlFile) {
                    xmlFile = file.load({
                        id: paramXML.id
                    });
                }
                xmlFile.folder = idFolder;
                xmlFile.name = "ExpenseXML" + recordId + "-" + paramXML.id; //numLine;
                xmlFile.save();
                var uuidRecord = record.create({
                    type: 'customrecord_xml_used_uuid',
                    isDynamic: true
                });
                uuidRecord.setValue({
                    fieldId: 'name',
                    value: uuid
                });
                var uuidID = uuidRecord.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });
            }

            // return "Se ha concluido satisfactoriamente el proceso!";
            dataReturn.sucess = true;
        } catch (e) {
            log.error({ title: 'finish', details: e });
            dataReturn.error = e;
            dataReturn.sucess = false;
            return dataReturn;
            // throw "Ha ocurrido un error.";
        }
        return dataReturn;
    }

    function getTaxesXML(xmlId) {
        var dataReturn = {sucess: false, error: '', dataTax: [], dataReten: []};
        try {
            var scriptObj = runtime.getCurrentScript();
            log.debug('Remaining governance units: ' + scriptObj.getRemainingUsage());
            log.debug({title:'xmlID', details:xmlId});
            var xmlText = readFile(xmlId);
            var xml_vars = xml.Parser.fromString({
                text: xmlText
            });
            log.audit({
                title: "xml_vars",
                details: xml_vars
            });
            // ---------------------Impuestos resumen---------------------
            var nodoImpuestosRes = xml.XPath.select({
                node: xml_vars,
                xpath: 'cfdi:Comprobante//cfdi:Impuestos//cfdi:Traslados//cfdi:Traslado'
            });
            log.debug({title:'nodoImpuestosRes.length', details:nodoImpuestosRes.length});
            var impuestosXML = [];
            for (var index = 0; index < nodoImpuestosRes.length; index++) {
                // log.audit({title:'anyProveedor1_index: ' + index, details:nodoImpuestosRes[index]});
                var impuesto = nodoImpuestosRes[index].getAttributeNode({
                    name: 'Impuesto'
                });
                impuesto = impuesto.value;
                var factor = nodoImpuestosRes[index].getAttributeNode({
                    name: 'TipoFactor'
                });
                factor = factor.value;
                var tasaOCuota = nodoImpuestosRes[index].getAttributeNode({
                    name: 'TasaOCuota'
                });
                tasaOCuota = tasaOCuota.value;
                var importe = nodoImpuestosRes[index].getAttributeNode({
                    name: 'Importe'
                });
                importe = importe.value;
                var base = nodoImpuestosRes[index].getAttributeNode({
                    name: 'Base'
                });
                if (base) {
                    base = base.value;
                    log.debug({title:'Base', details:base});
                }else{
                    var porcentAux = parseFloat(tasaOCuota*100);
                    base = parseFloat(100*importe);
                    base = parseFloat(base/porcentAux)
                    base = base.toFixed(2);
                    log.debug({title:'Base calculada', details:base});
                }
                var datosLine = {
                    impuesto: impuesto,
                    base: base,
                    factor: factor,
                    tasaOCuota: tasaOCuota,
                    importe: importe,
                    taxid: '',
                    taxtype: '',
                    porcenttasa: ''
                }
                impuestosXML.push(datosLine);
                // log.audit({ title: 'Data impuestos index: ' + index, details: JSON.stringify(datosLine)});
            }
            impuestosXML = impuestosXML.reverse();
            log.debug({title:'impuestosXML_resumen', details:impuestosXML});
            var impuestosClear = [];
            var impuestosCodes = [];
            var impuestoAux = [];
            for (var index = 0; index < impuestosXML.length; index++) {
                var dataLine = impuestosXML[index];
                var impuesto_xml = dataLine.impuesto;
                var tasaOCuota_xml = dataLine.tasaOCuota;
                var datAux = impuesto_xml + tasaOCuota_xml;
                if (impuestoAux.indexOf(datAux) == -1) { // Impuesto no guardado 
                    impuestoAux.push(datAux);
                    impuestosClear.push(dataLine);
                    impuestosCodes.push(impuesto_xml);
                }
            }
            log.debug({title:'impuestos en resumen', details:impuestosClear});
            // ---------------------Impuestos locales---------------------
            var nodoImpuestosLoc
            try {
                nodoImpuestosLoc = xml.XPath.select({
                    node: xml_vars,
                    xpath: 'cfdi:Comprobante//cfdi:Complemento//implocal:ImpuestosLocales//implocal:TrasladosLocales'
                });
            } catch (error) {
                nodoImpuestosLoc = [];
                log.error({title:'ErrorControlado no impuesto local', details:error});
            }
            log.debug({title:'nodoImpuestosLoc.length', details:nodoImpuestosLoc.length});
            for (var index = 0; index < nodoImpuestosLoc.length; index++) {
                var locTrasladado = nodoImpuestosLoc[index].getAttributeNode({
                    name: 'ImpLocTrasladado'
                });
                locTrasladado = locTrasladado.value;
                var tasadeTraslado = nodoImpuestosLoc[index].getAttributeNode({
                    name: 'TasadeTraslado'
                });
                tasadeTraslado = tasadeTraslado.value;
                var importe = nodoImpuestosLoc[index].getAttributeNode({
                    name: 'Importe'
                });
                importe = importe.value;
                if (parseFloat(tasadeTraslado) > 1) { // la tasa de traslado es porcentaje y se tiene que convertir
                    var porcentAux = parseFloat(tasadeTraslado/100);
                    var base = parseFloat(importe) / parseFloat(porcentAux);
                }else{ // la tasa de traslado es numerica considerando 1.0 como el 100%
                    var base = parseFloat(importe) / parseFloat(tasadeTraslado);
                    tasadeTraslado = parseFloat(tasadeTraslado) * 100;
                }
                base = base.toFixed(2);
                var datosLine = {
                    locTrasladado: locTrasladado,
                    tasadeTraslado: tasadeTraslado,
                    base: base,
                    importe: importe,
                    taxid: '',
                    taxtype: '',
                    porcenttasa: ''
                }
                impuestosClear.push(datosLine);
                impuestosCodes.push(locTrasladado);
                // log.audit({ title: 'Data Local index: ' + index, details: JSON.stringify(datosLine)});
            }
            log.debug({title:'impuestosXML_con_Locales', details:impuestosClear});
            // ---------------------Impuestos con ID's de Netsuite---------------------
            log.debug({title:'impuestosSearch', details:impuestosCodes});
            var taxFiltersAux = [];
            for (var filterLine = 0; filterLine < impuestosCodes.length; filterLine++) {
                taxFiltersAux.push(["custrecord_fb_codigo_sat.custrecord_fb_cofido_sat_codigo","is",impuestosCodes[filterLine]]);
                if (filterLine < (impuestosCodes.length - 1)) {
                    taxFiltersAux.push("OR");
                }
            }
            var taxFilters = [["isinactive","is","F"], "AND", taxFiltersAux];
            log.debug({title:'taxFilters', details:taxFilters});
            var salestaxitemSearchObj = search.create({
                type: search.Type.SALES_TAX_ITEM,
                filters: taxFilters,
                columns:
                [
                   search.createColumn({
                      name: "internalid",
                      sort: search.Sort.ASC,
                      label: "ID interno"
                   }),
                   search.createColumn({name: "name", label: "Nombre"}),
                   search.createColumn({name: "taxtype", label: "Tipo de impuesto"}),
                   search.createColumn({name: "custrecord_ste_taxcode_ratetype", label: "Tax Rate Type"}),
                   search.createColumn({name: "custrecord_fb_codigo_sat", label: "Codigo SAT"}),
                   search.createColumn({
                      name: "custrecord_fb_cofido_sat_codigo",
                      join: "CUSTRECORD_FB_CODIGO_SAT",
                      label: "Codigo en XML"
                   }),
                   search.createColumn({
                      name: "custrecord_fb_codigos_sat_tasa",
                      join: "CUSTRECORD_FB_CODIGO_SAT",
                      label: "Tasa"
                   })
                ]
            });
            var taxResult = salestaxitemSearchObj.runPaged({
                pageSize: 1000
            });
            log.debug({title:'taxResult.count', details:taxResult.count});
            if (taxResult.count > 0) {
                var taxesData = [];
                taxResult.pageRanges.forEach(function(pageRange){
                    var myPage = taxResult.fetch({index: pageRange.index});
                    myPage.data.forEach(function(result){
                        var taxId = result.getValue({name: 'internalid'});
                        var taxName = result.getValue({name: 'name'});
                        var taxType = result.getValue({name: 'taxtype'});
                        var taxCodeSat = result.getValue({name: 'custrecord_fb_codigo_sat'});
                        var taxCodeXML = result.getValue({
                            name: "custrecord_fb_cofido_sat_codigo",
                            join: "CUSTRECORD_FB_CODIGO_SAT"
                        });
                        var taxCodeTasa = result.getValue({
                            name: "custrecord_fb_codigos_sat_tasa",
                            join: "CUSTRECORD_FB_CODIGO_SAT"
                        });
                        var taxObj = {
                            taxId: taxId,
                            taxName: taxName,
                            taxType: taxType,
                            taxCodeSat: taxCodeSat,
                            taxCodeXML: taxCodeXML,
                            taxCodeTasa: taxCodeTasa
                        };
                        taxesData.push(taxObj);
                        // log.debug({title:'taxObj', details:taxObj});
                    });
                });
                log.audit({title:'taxesData', details:taxesData});
                log.debug({title:'impuestosXML_con_Locales 2433', details:impuestosClear});
                for (var lineI = 0; lineI < impuestosClear.length; lineI++) {
                    var impuestoCode, impuestoTasa;
                    if (impuestosClear[lineI].impuesto) { // es Impuesto
                        impuestoCode = impuestosClear[lineI].impuesto;
                        impuestoTasa = Number(impuestosClear[lineI].tasaOCuota);
                        impuestoTasa = impuestoTasa * 100;
                    }else if(impuestosClear[lineI].locTrasladado){ // es impuesto local
                        impuestoCode = impuestosClear[lineI].locTrasladado;
                        impuestoTasa = Number(impuestosClear[lineI].tasadeTraslado);
                    }
                    // log.debug({title:'Datos de impuesto lineI: ' + lineI, details:{impuestoCode: impuestoCode, impuestoTasa: impuestoTasa}});
                    for (var lineJ = 0; lineJ < taxesData.length; lineJ++) {
                        var nestuiteCode = taxesData[lineJ].taxCodeXML;
                        var netsuiteTasa = taxesData[lineJ].taxCodeTasa;
                        netsuiteTasa = netsuiteTasa.replace(/%/g, '');
                        netsuiteTasa = Number(netsuiteTasa);
                        // log.debug({title:'Datos de netsuite lineJ: ' + lineJ, details:{nestuiteCode: nestuiteCode, netsuiteTasa: netsuiteTasa}});
                        if (nestuiteCode == impuestoCode && netsuiteTasa == impuestoTasa) {
                            var taxId = taxesData[lineJ].taxId;
                            var taxType = taxesData[lineJ].taxType;
                            impuestosClear[lineI].taxid = taxId;
                            impuestosClear[lineI].taxtype = taxType;
                            impuestosClear[lineI].porcenttasa = netsuiteTasa;
                            break;
                        }
                    }
                }
                log.debug({title:'impuestosXML_clear', details:impuestosClear});
                dataReturn.dataTax = impuestosClear;
            }
            // ---------------------Impuestos Retenciones---------------------
            var nodoImpuestosReten = xml.XPath.select({
                node: xml_vars,
                xpath: 'cfdi:Comprobante//cfdi:Impuestos//cfdi:Retenciones//cfdi:Retencion'
            });
            log.debug({title:'nodoImpuestosReten.length', details:nodoImpuestosReten.length});
            if (nodoImpuestosReten.length) {
                var retencionesXML = [];
                for (var index = 0; index < nodoImpuestosReten.length; index++) {
                    log.audit({title:'nodoImpuestosReten_index: ' + index, details:nodoImpuestosReten[index]});
                    var impuesto = nodoImpuestosReten[index].getAttributeNode({
                        name: 'Impuesto'
                    });
                    impuesto = impuesto.value;
                    var importe = nodoImpuestosReten[index].getAttributeNode({
                        name: 'Importe'
                    });
                    importe = importe.value;
                    var datosLine = {
                        impuesto: impuesto,
                        importe: importe * -1
                    }
                    retencionesXML.push(datosLine);
                    log.debug({title:'DataFound', details:{impuesto: impuesto, importe: importe}});
                }
                retencionesXML = retencionesXML.reverse();
                log.debug({title:'retencionesXML_resumen', details:retencionesXML});
                var retencionesClear = [];
                var impuestoAux = [];
                for (var index = 0; index < retencionesXML.length; index++) {
                    var dataLine = retencionesXML[index];
                    var impuesto_xml = dataLine.impuesto;
                    if (impuestoAux.indexOf(impuesto_xml) == -1) { // Impuesto no guardado 
                        impuestoAux.push(impuesto_xml);
                        retencionesClear.push(dataLine);
                    }
                }
                log.debug({title:'retenciones en Clear', details:retencionesClear});
                dataReturn.dataReten = retencionesClear;
            }
            // ---------------------FIN---------------------
            dataReturn.sucess = true;
        } catch (error) {
            log.error({title:'getTaxesXML', details:error});
            dataReturn.sucess=false;
            dataReturn.error=error;
        }
        return dataReturn;
    }

     function getCreateFolder(idReport) {

         var result = search.create({
             type: search.Type.FOLDER,
             filters: [
                 ['name', search.Operator.IS, "expenseReport" + idReport]
             ]
         });

         var resultData = result.run().getRange({ start: 0, end: 1 });

         if (resultData.length) {
             return resultData[0].id;
         }

         var scriptObj = runtime.getCurrentScript();
         var idPadre = scriptObj.getParameter({ name: 'custscript_xml_folder' });

         var newFolder = record.create({
             type: record.Type.FOLDER
         });
         newFolder.setValue({
             fieldId: 'name',
             value: "expenseReport" + idReport
         });
         newFolder.setValue({
             fieldId: 'parent',
             value: idPadre
         });
         var newFolderID = newFolder.save({
             enableSourcing: true,
             igonoreMandatoryFields: true
         });
         log.audit({ title: 'newFolderID', details: newFolderID });
         return newFolderID;
     }

    function getValueXMl(xmlDocument, node, attribute) {
        log.audit({ title: 'getValueXMl - xmlDocument', details: xmlDocument });
        log.audit({ title: 'getValueXMl - node', details: node });
        log.audit({ title: 'getValueXMl - attribute', details: attribute });
        var invoiceXML = xml.Parser.fromString({
            text: xmlDocument
        });

        var nodeInfo = xml.XPath.select({
            node: invoiceXML,
            xpath: node
        });

        if (!nodeInfo[0]) {
            throw node + " doesn't exist.";
        }
        if (!attribute) {
            return nodeInfo[0].textContent;
        }
        var att = nodeInfo[0].getAttributeNode({
            name: attribute
        });

        att = att.value;
        return att;
    }

     function getTaxNodes(xmlDocument, xPath) {
         var invoiceXML = xml.Parser.fromString({
             text: xmlDocument
         });
         var nodeInfo = xml.XPath.select({
             node: invoiceXML,
             xpath: xPath
         });

         return nodeInfo;
     }

    function readFile(fileId) {
        try {
            var uploadedFile = file.load({
                'id': fileId
            });
            log.debug({title:'readFile', details:uploadedFile});
            var fileContent = uploadedFile.getContents();
            log.debug({title:'fileContent', details:fileContent});
            xmlFile = uploadedFile;
            return fileContent;
        } catch (e) {
            log.error({ title: 'readFile', details: e });
            throw "Ha ocurrido un error.";
        }
    }

    function getTranslationLabel(idField) {
        var currentUser = runtime.getCurrentUser(),
            currentLang = currentUser.getPreference({ name: "LANGUAGE" }),
            idLanguage = "";
        switch (currentLang) {
            case "es_AR":
                idLanguage = "custrecord_xml_la_text";
                break;
            case "es_ES":
                idLanguage = "custrecord_xml_spanish_text";
                break;
            case "en":
                idLanguage = "custrecord_xml_en_int_text";
                break;
            case "en_AU":
                idLanguage = "custrecord_xml_en_au_text";
                break;
            case "en_CA":
                idLanguage = "custrecord_xml_en_ca_text";
                break;
            case "en_GB":
                idLanguage = "custrecord_xml_en_uk_text";
                break;
            case "en_US":
                idLanguage = "custrecord_xml_english_text";
                break;
            default:
                idLanguage = "custrecord_xml_la_text";
                break;
        }

        var searchInfo = search.create({
            type: 'customrecord_xml_val_trans',
            filters: [
                ['isinactive', search.Operator.IS, 'F'],
                "AND",
                ['name', search.Operator.IS, idField]
            ],
            columns: [
                { name: idLanguage }
            ]
        });
        var resultSearch = searchInfo.run(),
        resultData = resultSearch.getRange(0, 1),
        resultLabel = "";

        if (!resultData.length) {
            resultLabel = 'No Label';
        }else {
            resultLabel = resultData[0].getValue({ name: idLanguage }) || 'No Label';;
        }
        return resultLabel;
    }

    function getCustomFields() {
        var dataReturn = {sucess: false, error: '', data: []}
        try {
            var camposSearch = search.create({
                type: "customrecord_fb_validator_fields",
                filters:
                [
                   ["isinactive","is","F"]
                ],
                columns:
                [
                   search.createColumn({
                      name: "internalid",
                      sort: search.Sort.ASC,
                      label: "ID interno"
                   }),
                   search.createColumn({name: "custrecord_fb_validator_field_id_trad", label: "Id de traducción"}),
                   search.createColumn({name: "custrecord_fb_validator_field_id_nets", label: "ID valor a setear"}),
                   search.createColumn({name: "custrecord_fb_validator_field_type", label: "Tipo de campo"}),
                   search.createColumn({name: "custrecord_fb_validator_field_type_reg", label: "Lista/Registro"}),
                   search.createColumn({name: "custrecord_fb_validator_field_mandatory", label: "Obligatorio"}),
                   search.createColumn({name: "custrecord_fb_validator_field_id_search", label: "ID valor a buscar"}),
                   search.createColumn({name: "custrecord_fb_validator_field_filters", label: "Filtros sobre el resultado"}),
                   search.createColumn({name: "custrecord_fb_validator_field_level", label: "Campo a nivel Linea"}),
                   search.createColumn({name: "custrecord_fb_validator_field_sublist", label: "Sublista"})
                ]
            });
            var camposResult = camposSearch.runPaged({
                pageSize: 1000
            });
            var dataCampos = [];
            if (camposResult.count > 0) {
                camposResult.pageRanges.forEach(function(pageRange){
                    var myPage = camposResult.fetch({index: pageRange.index});
                    myPage.data.forEach(function(result){
                        var idTraduccion = result.getValue({name: 'custrecord_fb_validator_field_id_trad'});
                        var idNetsuite = result.getValue({name: 'custrecord_fb_validator_field_id_nets'});
                        var tipoCampo = result.getValue({name: 'custrecord_fb_validator_field_type'});
                        var listaUse = result.getValue({name: 'custrecord_fb_validator_field_type_reg'}) || '';
                        var mandatory = result.getValue({name: 'custrecord_fb_validator_field_mandatory'});
                        var idSearch = result.getValue({name: 'custrecord_fb_validator_field_id_search'}) || '';
                        var extraFilter = result.getValue({name: 'custrecord_fb_validator_field_filters'});
                        var nivelCampo = result.getValue({name: 'custrecord_fb_validator_field_level'});
                        var sublista = result.getValue({name: 'custrecord_fb_validator_field_sublist'}) || '';
                        dataCampos.push({idTraduccion: idTraduccion, idNetsuite: idNetsuite, idSearch: idSearch, tipoCampo:tipoCampo, listaUse: listaUse, mandatory: mandatory, filtros: extraFilter, nivelCampo: nivelCampo, sublista: sublista});
                    });
                });
                log.audit({title:'dataCampos', details:dataCampos});
            }
            dataReturn.sucess = true;
            dataReturn.data = dataCampos;
        } catch (error) {
            log.error({title:'getCustomFields', details:error});
            dataReturn.sucess = false;
            dataReturn.error = error;
        }
        return dataReturn;
    }

    return {
        onRequest: onRequest
    }
});
