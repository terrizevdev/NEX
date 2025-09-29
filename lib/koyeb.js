const axios = require("axios");
let koyeb_api = process.env.KOYEB_API;
let axiosConfig = {
  headers: {
    "Content-Type": "application/json;charset=UTF-8",
    Authorization: "Bearer " + koyeb_api
  }
};

async function get_deployments() {
  status = false;
  let config = {
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      Authorization: "Bearer " + koyeb_api
    }
  };
  await axios.get("https://app.koyeb.com/v1/deployments", config).then(response => {
    let statuses = ["STOPPED", "STOPPING", "ERROR", "ERRPRING"];
    let activeDeployments = [];
    for (let i = 0; i < response.data.deployments.length; i++) {
      if (!statuses.includes(response.data.deployments[i].status)) {
        activeDeployments.push(response.data.deployments[i].status);
      }
    }
    if (activeDeployments.length > 1) {
      status = "true";
    }
  });
  return status;
}

function checkArray(array, key) {
  var found = false;
  for (var i = 0; i < array.length; i++) {
    if (array[i].key == key) {
      found = true;
      break;
    }
  }
  return found;
}

async function delvar(variable) {
  var result = false;
  let { data: services } = await axios.get("https://app.koyeb.com/v1/services", axiosConfig);
  let serviceId = services.services[0].id;
  let deployment = await axios.get("https://app.koyeb.com/v1/deployments/" + services.services[0].latest_deployment_id, axiosConfig);
  let envExists = checkArray(deployment.data.deployment.definition.env, variable);
  if (envExists !== true) {
    return "_No such env in koyeb._";
  }
  let newEnv = [];
  for (var i = 0; i < deployment.data.deployment.definition.env.length; i++) {
    if (deployment.data.deployment.definition.env[i].key === variable) {
      continue;
    }
    newEnv.push(deployment.data.deployment.definition.env[i]);
  }
  let updateData = {
    definition: {
      name: deployment.data.deployment.definition.name,
      routes: deployment.data.deployment.definition.routes,
      ports: deployment.data.deployment.definition.ports,
      env: newEnv,
      regions: deployment.data.deployment.definition.regions,
      scalings: deployment.data.deployment.definition.scalings,
      instance_types: deployment.data.deployment.definition.instance_types,
      health_checks: deployment.data.deployment.definition.health_checks,
      docker: deployment.data.deployment.definition.docker
    }
  };
  await axios.patch("https://app.koyeb.com/v1/services/" + serviceId, updateData, axiosConfig).then(response => {
    if (response.status === 200) {
      result = "_Successfully deleted " + variable + " var from koyeb._";
    } else {
      result = "_Please put Koyeb api key in var KOYEB_API._\nEg: KOYEB_API:api key";
    }
  });
  return result;
}

async function change_env(envVar) {
  var result = "_Please put Koyeb api key in var KOYEB_API._\nEg: KOYEB_API:api key";
  let { data: services } = await axios.get("https://app.koyeb.com/v1/services", axiosConfig);
  let serviceId = services.services[0].id;
  let deployment = await axios.get("https://app.koyeb.com/v1/deployments/" + services.services[0].latest_deployment_id, axiosConfig);
  let envParts = envVar.split(":");
  let newEnv = [];
  for (var i = 0; i < deployment.data.deployment.definition.env.length; i++) {
    if (deployment.data.deployment.definition.env[i].key === envParts[0]) {
      newEnv.push({
        scopes: ["region:fra"],
        key: "" + envParts[0],
        value: "" + envParts[1]
      });
    } else {
      newEnv.push(deployment.data.deployment.definition.env[i]);
    }
  }
  let envExists = checkArray(newEnv, envParts[0]);
  if (!envExists === true) {
    newEnv.push({
      scopes: ["region:fra"],
      key: "" + envParts[0],
      value: "" + envParts[1]
    });
  }
  let updateData = {
    definition: {
      name: deployment.data.deployment.definition.name,
      routes: deployment.data.deployment.definition.routes,
      ports: deployment.data.deployment.definition.ports,
      env: newEnv,
      regions: deployment.data.deployment.definition.regions,
      scalings: deployment.data.deployment.definition.scalings,
      instance_types: deployment.data.deployment.definition.instance_types,
      health_checks: deployment.data.deployment.definition.health_checks,
      docker: deployment.data.deployment.definition.docker
    }
  };
  await axios.patch("https://app.koyeb.com/v1/services/" + serviceId, updateData, axiosConfig).then(response => {
    if (response.status === 200) {
      result = "Successfuly changed var _" + envParts[0] + ":" + envParts[1] + " ._";
    } else {
      result = "_Please put Koyeb api key in var KOYEB_API._\nEg: KOYEB_API:api key";
    }
  });
  return result;
}

async function getallvar() {
  let { data: services } = await axios.get("https://app.koyeb.com/v1/services", axiosConfig);
  let deployment = await axios.get("https://app.koyeb.com/v1/deployments/" + services.services[0].latest_deployment_id, axiosConfig);
  let envVars = [];
  for (var i = 0; i < deployment.data.deployment.definition.env.length; i++) {
    if (!deployment.data.deployment.definition.env[i].key) {
      continue;
    }
    envVars.push("*" + deployment.data.deployment.definition.env[i].key + "* : _" + deployment.data.deployment.definition.env[i].value + "_");
  }
  return envVars.join("\n");
}

async function getvar(variable) {
  let { data: services } = await axios.get("https://app.koyeb.com/v1/services", axiosConfig);
  let deployment = await axios.get("https://app.koyeb.com/v1/deployments/" + services.services[0].latest_deployment_id, axiosConfig);
  for (var i = 0; i < deployment.data.deployment.definition.env.length; i++) {
    if (!deployment.data.deployment.definition.env[i].key) {
      continue;
    }
    if (deployment.data.deployment.definition.env[i].key === variable) {
      return deployment.data.deployment.definition.env[i].key + ":" + deployment.data.deployment.definition.env[i].value;
    }
  }
}

async function redeploy() {
  var result = false;
  var redeployData = {
    deployment_group: "prod",
    sha: ""
  };
  let { data: services } = await axios.get("https://app.koyeb.com/v1/services", axiosConfig);
  let serviceId = services.services[0].id;
  try {
    let response = await axios.post("https://app.koyeb.com/v1/services/" + serviceId + "/redeploy", redeployData, axiosConfig);
    result = "_update started._";
  } catch (error) {
    result = "*Got an error in redeploying.*\n*Please put koyeb api key in var KOYEB_API.*\n_Eg: KOYEB_API:api key from https://app.koyeb.com/account/api ._";
  }
  return result;
}

module.exports = {
  redeploy: redeploy,
  getvar: getvar,
  delvar: delvar,
  getallvar: getallvar,
  change_env: change_env,
  get_deployments: get_deployments
};