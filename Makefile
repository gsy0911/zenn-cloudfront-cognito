# 定数
$(eval AWS_ACCOUNT := $(shell aws sts get-caller-identity | jq -r .Account))
REGION := ap-northeast-1


.PHONY: help
help: ## show commands ## make
	@echo "AWS_ACCOUNT:= $(AWS_ACCOUNT)"
	@printf "\033[36m%-30s\033[0m %-50s %s\n" "[Sub command]" "[Description]" "[Example]"
	@grep -E '^[/a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | perl -pe 's%^([/a-zA-Z_-]+):.*?(##)%$$1 $$2%' | awk -F " *?## *?" '{printf "\033[36m%-30s\033[0m %-50s %s\n", $$1, $$2, $$3}'


.PHONY: login
login: ## login to ecr ## make login profile=()
	@aws ecr get-login-password | docker login --username AWS --password-stdin https://$(AWS_ACCOUNT).dkr.ecr.$(REGION).amazonaws.com
