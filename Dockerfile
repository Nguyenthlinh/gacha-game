FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
RUN apt-get update && apt-get install -y libicu-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["MyMvcProject.csproj", "."]
RUN dotnet restore "MyMvcProject.csproj"
COPY . .
RUN dotnet publish "MyMvcProject.csproj" -c Release -o /app/publish /p:UseAppHost=false /p:Parallel=false --maxcpucount:1

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MyMvcProject.dll"]
